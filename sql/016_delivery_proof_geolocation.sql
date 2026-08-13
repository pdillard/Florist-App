-- The marketing site has always promised "a timestamp, a GPS point, and a
-- photo" as delivery proof, but delivery_proofs only ever stored the photo
-- and an uploaded-by/timestamp - there was no GPS capture at drop-off, only
-- the destination address's geocoded coordinates entered at order creation
-- (delivery_lat/delivery_lng on orders, which just describe where the
-- order was supposed to go, not confirmation the driver was actually
-- there). This migration closes that gap so the claim is literally true.
--
-- Nullable on purpose: a driver's browser can deny location permission, or
-- the device may not support it. Proof still requires a photo + server
-- timestamp either way (see 008_order_state_machine.sql); GPS is captured
-- opportunistically as an extra corroborating data point, not a hard
-- requirement that could block a delivery from being confirmed.
alter table public.delivery_proofs
  add column if not exists lat numeric,
  add column if not exists lng numeric,
  add column if not exists location_accuracy_m numeric,
  add column if not exists created_at timestamptz not null default now();

comment on column public.delivery_proofs.lat is
  'Driver device GPS latitude captured at the moment the proof photo was uploaded, if location permission was granted. Null if denied/unavailable.';
comment on column public.delivery_proofs.lng is
  'Driver device GPS longitude captured at the moment the proof photo was uploaded, if location permission was granted. Null if denied/unavailable.';
comment on column public.delivery_proofs.location_accuracy_m is
  'Reported accuracy radius, in meters, of the captured GPS reading (navigator.geolocation coords.accuracy). Lets a merchant judge how much to trust a given point.';
