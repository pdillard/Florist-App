-- profiles_read_all currently has qual = true, meaning the public anon key
-- can read every user's name and phone with no login at all, not just
-- across shops, but from anyone on the internet who has your anon key
-- (which is meant to be public, see sql-adjacent note in section 8 of the
-- handoff doc: "the anon key is public by design, RLS protects data").
-- That's the actually urgent part, exploitable today with a single shop.
--
-- This fix requires being signed in to read profiles at all. It does NOT
-- fully fix cross-shop isolation: a signed-in user from one shop could
-- still read another shop's staff/customer names, since this doesn't add
-- a merchant_id check. That's a real gap, but it only matters once a
-- second real shop exists (Step 3, still deferred by choice), and fixing
-- it properly means deciding, case by case, who legitimately needs to
-- read whose profile (a merchant reading their own shop's driver names,
-- a merchant reading a customer's name from their own order's event
-- history, etc.) rather than one blanket rule. Worth doing before
-- onboarding a second shop, not before this first launch.

alter policy profiles_read_all on public.profiles
  using (auth.uid() is not null);
