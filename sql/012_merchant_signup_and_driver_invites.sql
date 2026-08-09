-- Multi-tenancy, step 3: self-serve signup for a second (and third, and
-- Nth) real shop. Before this, handle_new_user() never set merchant_id at
-- all, so any new merchant or driver signup landed with merchant_id = null
-- and was effectively broken (every merchant_id-scoped RLS check and RPC
-- fails on null) - "bringing one on today means a manual SQL insert" was
-- literal, not just slow.
--
-- Two different signup shapes, on purpose:
--   - Merchant signup CREATES a shop. No invite needed, same as signing up
--     for any multi-tenant SaaS - you don't need permission to make your
--     own account.
--   - Driver signup JOINS an existing shop via that shop's invite code
--     (shown to the merchant on the Drivers dashboard page, sql/013 wires
--     the RPC to regenerate it). Without this, anyone picking "driver" at
--     signup could attach themselves to literally any shop's roster - a
--     shop shouldn't be silently claimable just by knowing it exists.
--
-- Also closes a gap that predates multi-tenancy entirely: the merchants
-- table has never had row level security enabled, so with the anon key
-- alone anyone could currently select/insert/update/delete every shop's
-- row directly. Found while touching this table for invite_code, fixed
-- here since it's the same table and cheap to close now.

-- 1. Invite codes need a generator before anything else references it.
create or replace function public.generate_invite_code()
returns text
language sql
volatile
set search_path = ''
as $$
  -- 8 uppercase hex chars, ~4 billion possibilities. Not cryptographic
  -- secrecy-grade, just enough that it isn't guessable by a driver typing
  -- random strings. Collisions are caught by the unique constraint below
  -- and simply fail the insert/update, retry is on the caller.
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;

alter table public.merchants add column invite_code text;
update public.merchants set invite_code = public.generate_invite_code() where invite_code is null;
alter table public.merchants alter column invite_code set not null;
alter table public.merchants alter column invite_code set default public.generate_invite_code();
alter table public.merchants add constraint merchants_invite_code_key unique (invite_code);

-- 2. Lock down the merchants table itself - this was wide open before.
alter table public.merchants enable row level security;

create policy merchants_select_own on public.merchants
  for select
  using (id = public.my_merchant_id());

create policy merchants_update_own on public.merchants
  for update
  using (public.is_merchant() and id = public.my_merchant_id());

-- No insert/delete policy for anon/authenticated: a shop is only ever
-- created by handle_new_user() below, which runs security definer
-- (bypasses RLS) and is triggered off auth.users, not called directly.

-- 3. handle_new_user(): now branches on role to decide merchant_id instead
-- of always leaving it null.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_merchant_id uuid;
  v_shop_name text;
  v_invite_code text;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'customer');

  if v_role = 'merchant' then
    v_shop_name := nullif(trim(new.raw_user_meta_data->>'shop_name'), '');

    insert into public.merchants (name, invite_code)
    values (coalesce(v_shop_name, 'My Shop'), public.generate_invite_code())
    returning id into v_merchant_id;

  elsif v_role = 'driver' then
    v_invite_code := upper(trim(coalesce(new.raw_user_meta_data->>'invite_code', '')));

    if v_invite_code = '' then
      raise exception 'a shop invite code is required to sign up as a driver';
    end if;

    select id into v_merchant_id
      from public.merchants
      where invite_code = v_invite_code;

    if v_merchant_id is null then
      raise exception 'invalid shop invite code';
    end if;
  end if;

  -- customers stay merchant_id = null: not scoped to one shop.

  insert into public.profiles (id, role, name, merchant_id)
  values (new.id, v_role, new.raw_user_meta_data->>'name', v_merchant_id);

  if v_role = 'driver' then
    insert into public.driver_profiles (user_id, is_available)
    values (new.id, true);
  end if;

  return new;
end;
$$;

-- 4. Let a merchant rotate their shop's invite code from the dashboard
-- (e.g. if it leaked, or an old driver hire never worked out).
create or replace function public.regenerate_invite_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_merchant_id uuid;
  v_new_code text;
begin
  if not public.is_merchant() then
    raise exception 'only merchants can regenerate an invite code';
  end if;

  v_merchant_id := public.my_merchant_id();
  if v_merchant_id is null then
    raise exception 'your account is not linked to a shop';
  end if;

  v_new_code := public.generate_invite_code();

  update public.merchants
    set invite_code = v_new_code
    where id = v_merchant_id;

  return v_new_code;
end;
$$;

grant execute on function public.regenerate_invite_code() to authenticated;

-- Note on error surfacing: Supabase's GoTrue sometimes returns a generic
-- "Database error saving new user" to the client instead of the specific
-- raise exception message above (the real message lands in the Supabase
-- project's Postgres logs, not necessarily the API response). The login
-- page's copy is written to not depend on the exact server string coming
-- through.
