-- Rename florist -> merchant across the role value, the helper function,
-- and every RLS policy that reads profiles.role.
--
-- This was written from the actual current definitions (pulled via
-- pg_get_functiondef and pg_policies), not guessed. Order matters:
-- 1. Create is_merchant() first.
-- 2. Repoint every policy/function that referenced is_florist() or an
--    inline role = 'florist' check, at is_merchant() / role = 'merchant'.
-- 3. Migrate existing data (profiles.role 'florist' -> 'merchant').
-- 4. Drop is_florist() last, once nothing references it.
-- Running it out of order would leave a window where merchant accounts
-- have no access, so run this whole file in one go.

-- 1. New helper function.
create or replace function public.is_merchant()
returns boolean
language sql
stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'merchant'
  );
$$;

-- 2a. Policies that called is_florist() directly.

alter policy deliveries_florist_write on public.deliveries
  using (public.is_merchant());
alter policy deliveries_florist_write on public.deliveries
  rename to deliveries_merchant_write;

alter policy deliveries_select on public.deliveries
  using (
    driver_id = auth.uid()
    or public.is_merchant()
    or public.owns_order(order_id)
  );

alter policy orders_florist_update on public.orders
  using (public.is_merchant());
alter policy orders_florist_update on public.orders
  rename to orders_merchant_update;

alter policy orders_select on public.orders
  using (
    customer_id = auth.uid()
    or public.is_merchant()
    or public.is_order_driver(id)
  );

alter policy products_florist_write on public.products
  using (public.is_merchant());
alter policy products_florist_write on public.products
  rename to products_merchant_write;

-- 2b. Policies that inlined role = 'florist' instead of calling the helper.
--     Same substitution, kept as inline checks to match what's actually
--     there rather than silently changing the pattern mid-rename.

alter policy delivery_proofs_select on public.delivery_proofs
  using (
    exists (
      select 1
      from public.deliveries d
      join public.orders o on o.id = d.order_id
      where d.id = delivery_proofs.delivery_id
        and (
          d.driver_id = auth.uid()
          or o.customer_id = auth.uid()
          or exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'merchant'
          )
        )
    )
  );

alter policy driver_profiles_florist on public.driver_profiles
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'merchant'
    )
  );
alter policy driver_profiles_florist on public.driver_profiles
  rename to driver_profiles_merchant;

alter policy order_events_florist_insert on public.order_events
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'merchant'
    )
  );
alter policy order_events_florist_insert on public.order_events
  rename to order_events_merchant_insert;

alter policy order_events_select on public.order_events
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_events.order_id
        and (
          o.customer_id = auth.uid()
          or exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'merchant'
          )
        )
    )
  );

alter policy order_items_insert on public.order_items
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          o.customer_id = auth.uid()
          or exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'merchant'
          )
        )
    )
  );

alter policy order_items_select on public.order_items
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          o.customer_id = auth.uid()
          or exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'merchant'
          )
        )
    )
  );

alter policy orders_insert on public.orders
  with check (
    customer_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'merchant'
    )
  );

-- 3. The RPC function that also checked is_florist() directly.
create or replace function public.assign_driver(
  p_order_id uuid,
  p_driver_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delivery_id uuid;
  v_prev_status text;
  v_driver_role text;
begin
  if not public.is_merchant() then
    raise exception 'only merchants can assign drivers';
  end if;

  select role into v_driver_role from public.profiles where id = p_driver_id;
  if v_driver_role is distinct from 'driver' then
    raise exception 'selected user is not a driver';
  end if;

  select status into v_prev_status from public.orders where id = p_order_id;
  if v_prev_status is null then
    raise exception 'order not found';
  end if;

  if exists (select 1 from public.deliveries where order_id = p_order_id) then
    raise exception 'order already has a delivery assigned';
  end if;

  insert into public.deliveries (order_id, driver_id, assigned_at)
    values (p_order_id, p_driver_id, now())
    returning id into v_delivery_id;

  update public.orders set status = 'assigned' where id = p_order_id;

  insert into public.order_events (order_id, from_status, to_status, actor_id)
    values (p_order_id, v_prev_status, 'assigned', auth.uid());

  return v_delivery_id;
end;
$$;

-- 4. Migrate existing data now that everything reading role is updated.
update public.profiles set role = 'merchant' where role = 'florist';

-- 5. Nothing references is_florist() anymore, safe to drop.
drop function public.is_florist();
