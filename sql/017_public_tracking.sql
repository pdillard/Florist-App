-- Found during a security review: the customer tracking page
-- (frontend/src/app/(customer)/track/[orderId]/page.tsx) has always been
-- marketed as "no login required" - a link a shop sends to whoever's
-- receiving the flowers, no account needed. But orders_select (sql/006)
-- only allows customer_id = auth.uid(), a same-shop merchant, or the
-- assigned driver - there is no anon path. And merchant_create_order
-- (sql/007), the only order-entry path actually wired up today, always
-- sets customer_id = null. Net effect: an anonymous visitor to a tracking
-- link gets zero rows back, every time. Not a data leak - the opposite
-- problem, a core feature that's never actually worked for its intended
-- audience.
--
-- The fix is deliberately NOT a new anon-facing RLS policy on the orders
-- table itself. RLS policies apply to every access path to that table,
-- including a raw PostgREST query - "using (true)" scoped only by "you
-- have to already know the id" would still hand back every column on that
-- row (total_cents, recipient_phone, card_message, customer_id,
-- merchant_id) to anyone who found or guessed a valid uuid, through the
-- REST API directly, not just through the tracking page. Instead, two
-- narrow SECURITY DEFINER functions expose only the columns the tracking
-- page actually renders, the same least-privilege pattern as every other
-- function in this file set (search_path pinned, fully-qualified table
-- names).

-- Status + the handful of display fields the tracking page uses. No
-- total_cents, no recipient_phone, no card_message, no customer_id/
-- merchant_id - none of that is rendered on this page and none of it
-- needs to be reachable by someone who only has a link.
create or replace function public.get_order_tracking(p_order_id uuid)
returns table (
  id uuid,
  status text,
  recipient_name text,
  delivery_address text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select o.id, o.status, o.recipient_name, o.delivery_address, o.created_at
  from public.orders o
  where o.id = p_order_id;
$$;

grant execute on function public.get_order_tracking(uuid) to anon, authenticated;

-- Delivery proof for the same page: only once the order is actually
-- 'delivered' (checked here, server-side, not just gated client-side by
-- the calling page's own logic). Returns the storage path, not a signed
-- URL - minting the signed URL still requires the service role, since
-- storage.objects RLS (sql/009) has no anon read policy and shouldn't
-- get one for the same reason orders doesn't (see api/track/[orderId]/
-- proof/route.ts, which calls this function first and only ever signs
-- the path it gets back, never a client-supplied one).
create or replace function public.get_delivery_proof_for_tracking(p_order_id uuid)
returns table (
  photo_path text,
  lat numeric,
  lng numeric,
  location_accuracy_m numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select dp.photo_url, dp.lat, dp.lng, dp.location_accuracy_m
  from public.delivery_proofs dp
  join public.deliveries d on d.id = dp.delivery_id
  join public.orders o on o.id = d.order_id
  where o.id = p_order_id
    and o.status = 'delivered'
  order by dp.created_at desc
  limit 1;
$$;

grant execute on function public.get_delivery_proof_for_tracking(uuid) to anon, authenticated;
