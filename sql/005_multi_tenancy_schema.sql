-- Multi-tenancy, step 1: schema.
--
-- merchants is the new tenant table. merchant_id gets added to the three
-- tables that actually need direct tenant scoping:
--   - profiles  (nullable - only merchant staff and drivers have one,
--                customers don't belong to any single shop)
--   - products  (a shop's catalog)
--   - orders    (which shop this order belongs to)
--
-- Everything downstream of orders (order_items, deliveries, delivery_proofs,
-- order_events) does NOT get its own merchant_id column. It inherits tenant
-- scope through order_id -> orders.merchant_id, so there's one source of
-- truth instead of a column that could drift out of sync.

create table public.merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles add column merchant_id uuid references public.merchants(id);
alter table public.products add column merchant_id uuid references public.merchants(id);
alter table public.orders add column merchant_id uuid references public.merchants(id);

create index profiles_merchant_id_idx on public.profiles(merchant_id);
create index products_merchant_id_idx on public.products(merchant_id);
create index orders_merchant_id_idx on public.orders(merchant_id);

-- Backfill: everything that exists today belongs to one shop. Change the
-- name below before running, or update it afterward with:
--   update public.merchants set name = 'Real Shop Name' where id = '...';
do $$
declare
  v_merchant_id uuid;
begin
  insert into public.merchants (name)
  values ('My Florist Shop')
  returning id into v_merchant_id;

  update public.profiles set merchant_id = v_merchant_id where role in ('merchant', 'driver');
  update public.products set merchant_id = v_merchant_id;
  update public.orders set merchant_id = v_merchant_id;
end $$;

-- Now that every existing row has a merchant_id, require it going forward
-- for the tables where it's not optional. profiles stays nullable since
-- customers legitimately have none.
alter table public.products alter column merchant_id set not null;
alter table public.orders alter column merchant_id set not null;
