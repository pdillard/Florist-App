-- Realtime subscriptions only receive changes for tables added to the
-- supabase_realtime publication. Without this, the tracking page's
-- subscription connects successfully but silently never receives updates,
-- which looks like a bug but is actually just this missing step.
alter publication supabase_realtime add table public.orders;
