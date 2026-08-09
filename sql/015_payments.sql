-- Wires payment_status up to something real. Two ways an order gets
-- marked paid, on purpose kept as two separate, narrowly-scoped functions
-- rather than one function trusted with both:
--
--   - mark_order_paid_manually(): a merchant marking cash/check/POS
--     payment collected outside the app. Still supported - going all-in on
--     Stripe doesn't mean every florist customer pays online, phone orders
--     charged to an account or paid at pickup are common. Callable by
--     "authenticated", but internally checks the caller is a merchant who
--     owns the order.
--   - mark_order_paid_from_stripe(): called only by the webhook handler
--     (frontend/src/app/api/webhooks/stripe/route.ts), which runs with the
--     Supabase service role key, not a user session - there's no merchant
--     to check auth.uid() against, Stripe's signature on the webhook
--     request IS the authorization. Revoked from authenticated/anon so a
--     regular signed-in user cannot call this directly to fraudulently
--     mark their own order paid; only granted to service_role.
--
-- Deliberately NOT changed here: the order status state machine
-- (sql/008) still allows assigning a driver to an unpaid order. Gating
-- delivery on payment is a real product decision (does a shop ever want
-- to deliver before collecting payment - COD, invoiced accounts, etc.)
-- that wasn't asked for and shouldn't be smuggled into a payments migration.
-- What this migration guarantees is narrower and uncontroversial: a
-- 'pending' order that gets paid moves to 'confirmed', same as the
-- pre-Stripe state machine always intended.

create or replace function public._mark_order_paid(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  select status into v_status from public.orders where id = p_order_id;

  if v_status is null then
    raise exception 'order not found';
  end if;

  update public.orders set payment_status = 'paid' where id = p_order_id;

  if v_status = 'pending' then
    update public.orders set status = 'confirmed' where id = p_order_id;
    insert into public.order_events (order_id, from_status, to_status, actor_id)
      values (p_order_id, 'pending', 'confirmed', auth.uid());
  end if;
end;
$$;

-- No grants on _mark_order_paid itself - it's an internal helper, only
-- reachable through the two functions below.

create or replace function public.mark_order_paid_manually(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_merchant_id uuid;
begin
  if not public.is_merchant() then
    raise exception 'only merchants can mark an order as paid';
  end if;

  select merchant_id into v_merchant_id from public.orders where id = p_order_id;

  if v_merchant_id is null then
    raise exception 'order not found';
  end if;

  if v_merchant_id is distinct from public.my_merchant_id() then
    raise exception 'order does not belong to your shop';
  end if;

  perform public._mark_order_paid(p_order_id);
end;
$$;

grant execute on function public.mark_order_paid_manually(uuid) to authenticated;

create or replace function public.mark_order_paid_from_stripe(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._mark_order_paid(p_order_id);
end;
$$;

revoke all on function public.mark_order_paid_from_stripe(uuid) from public, authenticated, anon;
grant execute on function public.mark_order_paid_from_stripe(uuid) to service_role;
