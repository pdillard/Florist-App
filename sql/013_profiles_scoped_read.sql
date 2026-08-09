-- Closes the gap flagged (but deliberately not fixed) in
-- sql/011_profiles_require_auth.sql: profiles_read_all currently lets any
-- signed-in user read every profile, across every shop - name and phone
-- number, staff and customers alike. That was fine with one shop live; it
-- stops being fine the moment sql/012 lets a second real shop onboard.
--
-- Real access pattern, decided case by case as 011 said it should be:
--   1. Everyone can read their own profile. Always true, needed for the
--      app to function at all (role lookups, etc.).
--   2. A merchant can read their own shop's staff - other merchant
--      accounts and drivers with the same merchant_id. That's a direct
--      column comparison.
--   3. A merchant can read the profile of anyone tied to one of their own
--      shop's orders: the customer who placed it, whoever entered it
--      in-store (orders.created_by), the driver assigned to it
--      (deliveries.driver_id), and anyone who shows up as an actor in its
--      event history (order_events.actor_id). Customers don't carry a
--      merchant_id (they're not scoped to one shop, they can order from
--      several), so this can't be expressed as a merchant_id comparison -
--      it has to go through the order that connects them to this shop.
--
-- Anything outside those three stays hidden: a merchant can no longer
-- browse another shop's driver roster or customer list by profile id.

create or replace function public.merchant_can_read_profile(target_id uuid)
returns boolean
language sql
stable security definer
set search_path = ''
as $$
  select
    exists (
      select 1 from public.profiles p
      where p.id = target_id and p.merchant_id = public.my_merchant_id()
    )
    or exists (
      select 1 from public.orders o
      where o.merchant_id = public.my_merchant_id()
        and (o.customer_id = target_id or o.created_by = target_id)
    )
    or exists (
      select 1 from public.deliveries d
      join public.orders o on o.id = d.order_id
      where o.merchant_id = public.my_merchant_id() and d.driver_id = target_id
    )
    or exists (
      select 1 from public.order_events oe
      join public.orders o on o.id = oe.order_id
      where o.merchant_id = public.my_merchant_id() and oe.actor_id = target_id
    );
$$;

alter policy profiles_read_all on public.profiles
  using (
    id = auth.uid()
    or (public.is_merchant() and public.merchant_can_read_profile(id))
  );
