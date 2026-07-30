-- create_order: the only way an order should ever be created.
--
-- Why this exists instead of a plain client-side insert into orders/order_items:
--   1. Price integrity - the client sends product_id + qty only, never a price.
--      This function looks up the current price_cents itself, so a tampered
--      localStorage cart can never buy something below its real price.
--   2. Stock integrity - FOR UPDATE locks each product row while checking
--      stock_qty, so two concurrent checkouts can't both succeed on the last
--      item in stock.
--   3. Atomicity - the whole function runs in one implicit transaction. If any
--      item fails (out of stock, inactive, bad qty), every change made earlier
--      in the same call (stock decrements, inserted rows) is rolled back too.
--
-- SECURITY DEFINER means this function runs with the privileges of the user
-- who created it (bypassing RLS), not the calling customer. That means RLS is
-- NOT protecting anything inside this function's body - this function's own
-- logic (auth.uid() checks, ownership assignment) IS the security boundary.
-- set search_path = '' plus fully-qualified table names (public.products,
-- not products) avoids search_path hijacking, same pattern as is_florist(),
-- is_order_driver(), and owns_order().

create or replace function public.create_order(
  p_items jsonb,                              -- [{"product_id": "...", "qty": 2}, ...]
  p_recipient_name text,
  p_recipient_phone text,
  p_delivery_address text,
  p_delivery_lat numeric default null,
  p_delivery_lng numeric default null,
  p_delivery_window_start timestamptz default null,
  p_delivery_window_end timestamptz default null,
  p_card_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_total_cents int := 0;
  v_item jsonb;
  v_product_id uuid;
  v_qty int;
  v_price_cents int;
  v_stock_qty int;
  v_is_active boolean;
begin
  if auth.uid() is null then
    raise exception 'must be signed in to place an order';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'cart is empty';
  end if;

  if p_delivery_address is null or length(trim(p_delivery_address)) = 0 then
    raise exception 'delivery address is required';
  end if;

  insert into public.orders (
    customer_id, created_by, status,
    recipient_name, recipient_phone,
    delivery_address, delivery_lat, delivery_lng,
    delivery_window_start, delivery_window_end,
    card_message, total_cents, payment_status
  ) values (
    auth.uid(), auth.uid(), 'pending',
    p_recipient_name, p_recipient_phone,
    p_delivery_address, p_delivery_lat, p_delivery_lng,
    p_delivery_window_start, p_delivery_window_end,
    p_card_message, 0, 'unpaid'
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_qty := (v_item ->> 'qty')::int;

    if v_qty is null or v_qty <= 0 then
      raise exception 'invalid quantity for product %', v_product_id;
    end if;

    select price_cents, stock_qty, is_active
      into v_price_cents, v_stock_qty, v_is_active
      from public.products
      where id = v_product_id
      for update;

    if not found or not v_is_active then
      raise exception 'product % is not available', v_product_id;
    end if;

    if v_stock_qty < v_qty then
      raise exception 'not enough stock for product %', v_product_id;
    end if;

    update public.products
      set stock_qty = stock_qty - v_qty
      where id = v_product_id;

    insert into public.order_items (order_id, product_id, qty, unit_price_cents)
      values (v_order_id, v_product_id, v_qty, v_price_cents);

    v_total_cents := v_total_cents + (v_qty * v_price_cents);
  end loop;

  update public.orders set total_cents = v_total_cents where id = v_order_id;

  insert into public.order_events (order_id, from_status, to_status, actor_id)
    values (v_order_id, null, 'pending', auth.uid());

  return v_order_id;
end;
$$;

-- Only signed-in users can call this. RLS on the underlying tables is
-- bypassed inside the function (security definer), but nothing outside
-- this function grants direct write access to products/orders/order_items,
-- so this remains the only path to creating an order.
grant execute on function public.create_order(
  jsonb, text, text, text, numeric, numeric, timestamptz, timestamptz, text
) to authenticated;
