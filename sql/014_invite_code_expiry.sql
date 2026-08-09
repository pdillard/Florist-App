-- Tightens sql/012's invite codes. As shipped there, a code was a static
-- 8-char secret that worked forever until manually regenerated - fine for
-- a demo, not something to leave alone once real shops depend on it. A
-- code that leaks (screenshot, old text thread, an ex-driver who still has
-- it) stayed valid indefinitely.
--
-- What this adds: every code now carries an expiry, 14 days from
-- creation/regeneration. A merchant who's actively onboarding drivers
-- just regenerates (or doesn't - unused time left on a code they're
-- mid-hiring-round with still works); a code nobody's touched in two
-- weeks quietly stops working instead of staying live forever.
--
-- What this deliberately does NOT add: IP-based rate limiting on guessing
-- codes. That's not expressible in Postgres alone - Supabase Auth already
-- rate-limits the signup endpoint itself by IP at the platform level
-- (Dashboard -> Authentication -> Rate Limits), which is the right layer
-- for that, not a second thing to build and maintain here.

alter table public.merchants
  add column invite_code_expires_at timestamptz not null default (now() + interval '14 days');

-- Existing shop's code (created before this column existed) gets a fresh
-- 14-day window starting now, same as if it had just been regenerated.
update public.merchants set invite_code_expires_at = now() + interval '14 days';

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
  v_expires_at timestamptz;
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

    select id, invite_code_expires_at into v_merchant_id, v_expires_at
      from public.merchants
      where invite_code = v_invite_code;

    if v_merchant_id is null then
      raise exception 'invalid shop invite code';
    end if;

    if v_expires_at < now() then
      raise exception 'this invite code has expired, ask your shop for a new one';
    end if;
  end if;

  insert into public.profiles (id, role, name, merchant_id)
  values (new.id, v_role, new.raw_user_meta_data->>'name', v_merchant_id);

  if v_role = 'driver' then
    insert into public.driver_profiles (user_id, is_available)
    values (new.id, true);
  end if;

  return new;
end;
$$;

-- Return shape changes from a bare text to a row (code + new expiry), and
-- Postgres won't let create-or-replace change a function's return type -
-- drop it first.
drop function if exists public.regenerate_invite_code();

create function public.regenerate_invite_code()
returns table (invite_code text, invite_code_expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_merchant_id uuid;
  v_new_code text;
  v_new_expiry timestamptz;
begin
  if not public.is_merchant() then
    raise exception 'only merchants can regenerate an invite code';
  end if;

  v_merchant_id := public.my_merchant_id();
  if v_merchant_id is null then
    raise exception 'your account is not linked to a shop';
  end if;

  v_new_code := public.generate_invite_code();
  v_new_expiry := now() + interval '14 days';

  update public.merchants
    set invite_code = v_new_code, invite_code_expires_at = v_new_expiry
    where id = v_merchant_id;

  return query select v_new_code, v_new_expiry;
end;
$$;

grant execute on function public.regenerate_invite_code() to authenticated;
