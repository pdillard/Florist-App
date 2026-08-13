-- Supabase's own database linter (Dashboard -> Advisors -> Security) caught
-- something my manual review missed: Postgres grants EXECUTE on every newly
-- created function to PUBLIC by default, unless you explicitly revoke it.
-- Every "grant execute ... to authenticated" in this project's history
-- ADDED an explicit grant; none of them REVOKED the implicit PUBLIC one
-- first. PUBLIC includes anon. That's harmless for a function that checks
-- auth.uid()/is_merchant() internally (anon just gets rejected by the
-- function's own logic) - but it is NOT harmless for one that trusts its
-- caller completely.
--
-- That's exactly what public._mark_order_paid(p_order_id uuid) does
-- (sql/015). It was written as an "internal helper, no grants" - true only
-- in the sense that nothing EXPLICITLY granted it. It has zero auth checks
-- in its body (that's mark_order_paid_manually's and
-- mark_order_paid_from_stripe's job - they're supposed to be the only
-- callers). With the implicit PUBLIC grant never revoked, it was reachable
-- directly at /rest/v1/rpc/_mark_order_paid by literally anyone, signed in
-- or not, with any order id - marking any shop's order paid with no
-- payment, no Stripe involved, no ownership check. That's the most
-- serious finding of this whole review, and it slipped past manual
-- reading of the code because the bug isn't in what the code says, it's
-- in what Postgres does by default that the code never overrides. This is
-- exactly the kind of thing the linter exists to catch and manual review
-- can miss.
--
-- Fix: explicitly revoke from public/anon/authenticated everywhere a
-- function either (a) has no business being called directly at all
-- (internal helpers, predicate functions only ever used inside RLS
-- policies or other functions, and the auth.users trigger function, which
-- Postgres won't let you invoke directly anyway but is cleaned up here for
-- the same hygiene reason), or (b) is only supposed to be reachable by
-- authenticated users and was relying on its own internal check to turn
-- away anon rather than the grant itself doing that job.

-- (a) True internal-only functions: never meant to be called directly.
revoke all on function public._mark_order_paid(uuid) from public, anon, authenticated;
revoke all on function public.is_merchant() from public, anon, authenticated;
revoke all on function public.my_merchant_id() from public, anon, authenticated;
revoke all on function public.is_order_driver(uuid) from public, anon, authenticated;
revoke all on function public.owns_order(uuid) from public, anon, authenticated;
revoke all on function public.order_belongs_to_my_merchant(uuid) from public, anon, authenticated;
revoke all on function public.merchant_can_read_profile(uuid) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- RLS policies and other SECURITY DEFINER functions still call these
-- fine - revoking EXECUTE from a role doesn't affect a function calling
-- another function internally as its own (definer's) privileges, and RLS
-- policy expressions aren't subject to EXECUTE grants at all. This only
-- closes the direct /rest/v1/rpc/* path.

-- (b) Authenticated-only write RPCs: already correctly rejected anon via
-- their own is_merchant()/auth.uid() checks, but shouldn't depend on that
-- alone. Revoke the implicit PUBLIC grant, re-affirm authenticated.
revoke all on function public.create_order(
  jsonb, text, text, text, numeric, numeric, timestamptz, timestamptz, text
) from public, anon;
grant execute on function public.create_order(
  jsonb, text, text, text, numeric, numeric, timestamptz, timestamptz, text
) to authenticated;

revoke all on function public.merchant_create_order(
  jsonb, text, text, text, numeric, numeric, timestamptz, timestamptz, text
) from public, anon;
grant execute on function public.merchant_create_order(
  jsonb, text, text, text, numeric, numeric, timestamptz, timestamptz, text
) to authenticated;

revoke all on function public.assign_driver(uuid, uuid) from public, anon;
grant execute on function public.assign_driver(uuid, uuid) to authenticated;

revoke all on function public.update_order_status(uuid, text, text) from public, anon;
grant execute on function public.update_order_status(uuid, text, text) to authenticated;

revoke all on function public.mark_order_paid_manually(uuid) from public, anon;
grant execute on function public.mark_order_paid_manually(uuid) to authenticated;

revoke all on function public.regenerate_invite_code() from public, anon;
grant execute on function public.regenerate_invite_code() to authenticated;

-- create_order / merchant_create_order already had their "to authenticated"
-- grants from sql/001/007 and are untouched here beyond the revoke above.

-- (c) get_order_tracking / get_delivery_proof_for_tracking (sql/017) are
-- untouched - anon access there is intentional, that's the entire point
-- of those two functions.
