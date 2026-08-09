-- Storage bucket for delivery proof photos. Private (public = false),
-- access controlled entirely by RLS policies on storage.objects below,
-- same model as the table RLS elsewhere in this app.
--
-- Path convention: every uploaded file is stored at
--   {delivery_id}/{filename}
-- so ownership can be checked by reading the first path segment back out
-- with storage.foldername(name) and matching it against deliveries.id.
-- The frontend is responsible for uploading to that path shape.

insert into storage.buckets (id, name, public)
values ('delivery-proofs', 'delivery-proofs', false)
on conflict (id) do nothing;

create policy delivery_proofs_storage_driver_insert
on storage.objects for insert
with check (
  bucket_id = 'delivery-proofs'
  and exists (
    select 1 from public.deliveries d
    where d.id::text = (storage.foldername(name))[1]
      and d.driver_id = auth.uid()
  )
);

-- Read access for generating signed URLs: the assigned driver, the
-- customer who owns the order, or a merchant from the same shop.
create policy delivery_proofs_storage_read
on storage.objects for select
using (
  bucket_id = 'delivery-proofs'
  and exists (
    select 1
    from public.deliveries d
    join public.orders o on o.id = d.order_id
    where d.id::text = (storage.foldername(name))[1]
      and (
        d.driver_id = auth.uid()
        or o.customer_id = auth.uid()
        or (public.is_merchant() and o.merchant_id = public.my_merchant_id())
      )
  )
);
