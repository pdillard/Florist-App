-- assign_driver: florist assigns a driver to an order.
--
-- Bundles three writes into one atomic call: create the deliveries row,
-- move orders.status to 'assigned', and log the transition in order_events.
-- Doing these as three separate client calls risks a dropped connection
-- leaving the order half-assigned (e.g. a deliveries row with no matching
-- status update). One function call means all three happen or none do.
--
-- security definer + set search_path = '' + fully-qualified table names,
-- same pattern as create_order and the is_florist()/is_order_driver()/
-- owns_order() helpers.

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
  if not public.is_florist() then
    raise exception 'only florists can assign drivers';
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

grant execute on function public.assign_driver(uuid, uuid) to authenticated;
