-- Multi-tenancy, step 2: actually enforce tenant isolation in RLS.
--
-- Before this migration, every "is_merchant()" or "role = 'merchant'" check
-- in a policy only verified the caller IS a merchant, not that the row
-- belongs to THEIR shop. That means any merchant could already read or
-- write any other shop's orders, deliveries, drivers, etc. This migration
-- adds the missing merchant_id comparison to every one of those policies.
--
-- products_public_read is deliberately left untouched (still "is_active =
-- true", global across all shops). That's a public storefront read, not a
-- privacy leak, and there's no per-shop storefront routing yet (customer
-- shop is deprioritized per the positioning pivot). Revisit when that's
-- built.
--
-- Known gap NOT fixed here, flagging it rather than silently expanding
-- scope: profiles_read_all still lets anyone read anyone's name/phone,
-- across shops. Locking that down properly means deciding who legitimately
-- needs to read whose profile (own shop's staff, your own order's
-- customer, etc.), which is a separate, non-trivial policy design. Worth
-- doing before real customer data exists, not bundled into this step.

create or replace function public.my_merchant_id()
returns uuid
language sql
stable security definer
set search_path = ''
as $$
  select merchant_id from public.profiles where id = auth.uid();
$$;

create or replace function public.order_belongs_to_my_merchant(check_order_id uuid)
returns boolean
language sql
stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.orders
    where id = check_order_id and merchant_id = public.my_merchant_id()
  );
$$;

-- products: write access limited to your own shop's catalog.
alter policy products_merchant_write on public.products
  using (public.is_merchant() and merchant_id = public.my_merchant_id());

-- orders: read/write limited to your own shop's orders.
alter policy orders_merchant_update on public.orders
  using (public.is_merchant() and merchant_id = public.my_merchant_id());

alter policy orders_select on public.orders
  using (
    customer_id = auth.uid()
    or (public.is_merchant() and merchant_id = public.my_merchant_id())
    or public.is_order_driver(id)
  );

alter policy orders_insert on public.orders
  with check (
    customer_id = auth.uid()
    or (public.is_merchant() and merchant_id = public.my_merchant_id())
  );

-- deliveries: limited to the merchant who owns the underlying order.
alter policy deliveries_merchant_write on public.deliveries
  using (public.is_merchant() and public.order_belongs_to_my_merchant(order_id));

alter policy deliveries_select on public.deliveries
  using (
    driver_id = auth.uid()
    or (public.is_merchant() and public.order_belongs_to_my_merchant(order_id))
    or public.owns_order(order_id)
  );

-- delivery_proofs: same idea, via the delivery's order.
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
          or (public.is_merchant() and o.merchant_id = public.my_merchant_id())
        )
    )
  );

-- order_events: limited to the merchant who owns the order.
alter policy order_events_merchant_insert on public.order_events
  with check (public.is_merchant() and public.order_belongs_to_my_merchant(order_id));

alter policy order_events_select on public.order_events
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_events.order_id
        and (
          o.customer_id = auth.uid()
          or (public.is_merchant() and o.merchant_id = public.my_merchant_id())
        )
    )
  );

-- order_items: limited to the merchant who owns the parent order.
alter policy order_items_insert on public.order_items
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (
          o.customer_id = auth.uid()
          or (public.is_merchant() and o.merchant_id = public.my_merchant_id())
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
          or (public.is_merchant() and o.merchant_id = public.my_merchant_id())
        )
    )
  );

-- driver_profiles: a merchant manages only drivers who belong to their shop.
alter policy driver_profiles_merchant on public.driver_profiles
  using (
    public.is_merchant()
    and exists (
      select 1 from public.profiles p
      where p.id = driver_profiles.user_id and p.merchant_id = public.my_merchant_id()
    )
  );
