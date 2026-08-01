-- Fix create_order() (customer checkout) to set merchant_id, which became
-- required in the Step 1 multi-tenancy migration but was never wired up.
-- Also adds merchant_create_order() for phone/walk-in orders a merchant
-- enters directly, per the positioning pivot's new primary intake path.
--
-- Both derive merchant_id rather than trusting the client to send one:
-- create_order() takes it from the cart's products (and rejects a cart
-- that mixes shops); merchant_create_order() always uses the caller's own
-- shop via my_merchant_id(), and rejects any product that isn't theirs.

create or replace function public.create_order(
  p_items jsonb,
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
  v_merchant_id uuid;
  v_total_cents int := 0;
  v_item jsonb;
  v_product_id uuid;
  v_qty int;
  v_price_cents int;
  v_stock_qty int;
  v_is_active boolean;
  v_item_merchant_id uuid;
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

  -- Which shop does this order belong to? Taken from the first item;
  -- every other item is checked against it in the loop below.
  select merchant_id into v_merchant_id
    from public.products
    where id = ((p_items -> 0) ->> 'product_id')::uuid;

  if v_merchant_id is null then
    raise exception 'could not determine which shop this order belongs to';
  end if;

  insert into public.orders (
    customer_id, created_by, merchant_id, status,
    recipient_name, recipient_phone,
    delivery_address, delivery_lat, delivery_lng,
    delivery_window_start, delivery_window_end,
    card_message, total_cents, payment_status
  ) values (
    auth.uid(), auth.uid(), v_merchant_id, 'pending',
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

    select price_cents, stock_qty, is_active, merchant_id
      into v_price_cents, v_stock_qty, v_is_active, v_item_merchant_id
      from public.products
      where id = v_product_id
      for update;

    if not found or not v_is_active then
      raise exception 'product % is not available', v_product_id;
    end if;

    if v_item_merchant_id is distinct from v_merchant_id then
      raise exception 'cart contains items from more than one shop, checkout separately';
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

-- Merchant-entered order: recipient/delivery info comes from the form,
-- items always come from the merchant's own catalog.
create or replace function public.merchant_create_order(
  p_items jsonb,
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
  v_merchant_id uuid;
  v_total_cents int := 0;
  v_item jsonb;
  v_product_id uuid;
  v_qty int;
  v_price_cents int;
  v_stock_qty int;
  v_is_active boolean;
  v_item_merchant_id uuid;
begin
  if not public.is_merchant() then
    raise exception 'only merchants can enter an order this way';
  end if;

  v_merchant_id := public.my_merchant_id();
  if v_merchant_id is null then
    raise exception 'your account is not linked to a shop';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'order has no items';
  end if;

  if p_delivery_address is null or length(trim(p_delivery_address)) = 0 then
    raise exception 'delivery address is required';
  end if;

  -- No customer account involved, this is a phone/walk-in order.
  insert into public.orders (
    customer_id, created_by, merchant_id, status,
    recipient_name, recipient_phone,
    delivery_address, delivery_lat, delivery_lng,
    delivery_window_start, delivery_window_end,
    card_message, total_cents, payment_status
  ) values (
    null, auth.uid(), v_merchant_id, 'pending',
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

    select price_cents, stock_qty, is_active, merchant_id
      into v_price_cents, v_stock_qty, v_is_active, v_item_merchant_id
      from public.products
      where id = v_product_id
      for update;

    if not found or not v_is_active then
      raise exception 'product % is not available', v_product_id;
    end if;

    if v_item_merchant_id is distinct from v_merchant_id then
      raise exception 'product % does not belong to your shop', v_product_id;
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

grant execute on function public.merchant_create_order(
  jsonb, text, text, text, numeric, numeric, timestamptz, timestamptz, text
) to authenticated;
