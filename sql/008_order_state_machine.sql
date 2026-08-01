-- Order state machine: the only sanctioned way to change orders.status.
-- Legal transitions (matches the state machine documented in the handoff
-- doc, with one pragmatic allowance: pending/confirmed -> assigned directly,
-- skipping 'confirmed', since Stripe isn't wired up yet and assign_driver
-- already does this. Once payments exist, tighten this).
--
--   pending -> confirmed, assigned, cancelled
--   confirmed -> assigned, cancelled
--   assigned -> out_for_delivery, failed, cancelled
--   out_for_delivery -> delivered, failed
--
-- 'delivered' additionally requires a delivery_proofs row to already exist,
-- so a driver can't mark something delivered without evidence.

create or replace function public.update_order_status(
  p_order_id uuid,
  p_new_status text,
  p_failure_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_status text;
  v_merchant_id uuid;
  v_legal boolean;
begin
  select status, merchant_id into v_current_status, v_merchant_id
  from public.orders
  where id = p_order_id;

  if v_current_status is null then
    raise exception 'order not found';
  end if;

  if not (
    (public.is_merchant() and v_merchant_id = public.my_merchant_id())
    or public.is_order_driver(p_order_id)
  ) then
    raise exception 'not authorized to update this order';
  end if;

  v_legal := (
    (v_current_status = 'pending' and p_new_status in ('confirmed', 'assigned', 'cancelled'))
    or (v_current_status = 'confirmed' and p_new_status in ('assigned', 'cancelled'))
    or (v_current_status = 'assigned' and p_new_status in ('out_for_delivery', 'failed', 'cancelled'))
    or (v_current_status = 'out_for_delivery' and p_new_status in ('delivered', 'failed'))
  );

  if not v_legal then
    raise exception 'illegal status transition: % -> %', v_current_status, p_new_status;
  end if;

  if p_new_status = 'delivered' and not exists (
    select 1
    from public.delivery_proofs dp
    join public.deliveries d on d.id = dp.delivery_id
    where d.order_id = p_order_id
  ) then
    raise exception 'cannot mark delivered without a delivery proof';
  end if;

  if p_new_status = 'out_for_delivery' then
    update public.deliveries
      set picked_up_at = now()
      where order_id = p_order_id and picked_up_at is null;
  end if;

  if p_new_status = 'delivered' then
    update public.deliveries
      set delivered_at = now()
      where order_id = p_order_id and delivered_at is null;
  end if;

  if p_new_status = 'failed' then
    update public.deliveries
      set failure_reason = p_failure_reason
      where order_id = p_order_id;
  end if;

  update public.orders set status = p_new_status where id = p_order_id;

  insert into public.order_events (order_id, from_status, to_status, actor_id)
    values (p_order_id, v_current_status, p_new_status, auth.uid());
end;
$$;

grant execute on function public.update_order_status(uuid, text, text) to authenticated;

-- Fix: assign_driver checked that the target user has role = 'driver', but
-- never checked they belong to the SAME shop as the order. RLS on
-- driver_profiles already keeps the dashboard's dropdown scoped to a
-- merchant's own drivers, but assign_driver is security definer and
-- bypasses RLS entirely, so it never enforced this itself. A merchant
-- could previously assign another shop's driver by ID even though they'd
-- never see that driver in their own UI.
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
  v_order_merchant_id uuid;
  v_driver_role text;
  v_driver_merchant_id uuid;
begin
  if not public.is_merchant() then
    raise exception 'only merchants can assign drivers';
  end if;

  select status, merchant_id into v_prev_status, v_order_merchant_id
    from public.orders where id = p_order_id;

  if v_prev_status is null then
    raise exception 'order not found';
  end if;

  if v_order_merchant_id != public.my_merchant_id() then
    raise exception 'order does not belong to your shop';
  end if;

  select role, merchant_id into v_driver_role, v_driver_merchant_id
    from public.profiles where id = p_driver_id;

  if v_driver_role is distinct from 'driver' then
    raise exception 'selected user is not a driver';
  end if;

  if v_driver_merchant_id is distinct from v_order_merchant_id then
    raise exception 'selected driver does not belong to your shop';
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
