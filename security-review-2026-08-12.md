# Security Review — Florist Delivery Platform
**Date:** August 12, 2026
**Method:** Full adversarial code review of every RLS policy, SQL function, API route, and the storage/auth configuration, plus a full-history scan of the GitHub repo for leaked secrets. I could not run live black-box attacks against the deployed Supabase backend — outbound network access to `*.supabase.co` is blocked from this sandbox — so everything below is grounded in reading the actual enforcement logic (policies, functions, grants), not guesswork.

> **Update, same day:** you ran Supabase's own Dashboard → Advisors → Security scan and pasted the results back. It caught something my manual read missed — see "Update: critical finding from Supabase's linter" below. Fixed in `sql/018`.

## Bottom line

This is in noticeably better shape than a typical solo-built app at this stage. Whoever built the backend (an earlier session of mine, per the commit history) was already thinking adversarially: every privileged database function has `search_path` pinned (blocks a classic Postgres privilege-escalation trick), tenant isolation is enforced with real `merchant_id` comparisons rather than just role checks, and the commit history shows several *self-caught* fixes for cross-shop data leaks before they'd have mattered (an open `merchants` table, a driver-assignment IDOR, a fully public `profiles` table). That's the right posture.

I found one broken feature (not a leak — the opposite: the public tracking link couldn't actually be viewed by the people it's for) and a handful of real gaps, all listed below. I fixed everything fixable from code tonight. A few things need a setting changed in the Supabase dashboard, which I can't do from here.

---

## GitHub repo

- **Confirmed public.** Anyone can read the full source, including every RLS policy and business rule. This isn't itself a vulnerability — security should never depend on the code being secret, and based on this review it doesn't — but worth knowing, and worth double-checking that's what you intend.
- **No secrets ever committed**, in the current tree or anywhere in git history. Checked: `.env`/`.env.local` were never committed (not even before `.gitignore` existed — it's been there since the very first commit), no Stripe keys, Supabase service-role key, or JWT-shaped strings appear in any diff across all 28 commits. `.env.local.example` only ever contained empty placeholders.
- **Repo description is a stale template string** ("A business consultant AI to help with local businesses") — cosmetic, but worth fixing on GitHub since anyone landing on the repo sees it first.

## What's already solid (no action needed)

- **Every `SECURITY DEFINER` function pins `search_path = ''`** and fully-qualifies table names — the correct defense against search-path hijacking, applied consistently across all 17 migration files.
- **Tenant isolation is real**, not just role-based: every cross-shop write path (`assign_driver`, `merchant_create_order`, `update_order_status`, `mark_order_paid_manually`) explicitly checks `merchant_id` ownership, not just "are you a merchant."
- **Price/stock integrity**: order totals are always computed server-side from the real `products.price_cents`, never trusted from the client. Stock checks use `FOR UPDATE` row locks, so two concurrent orders can't oversell the last item.
- **Stripe webhook**: verifies the signature against the *raw* request body (correct — a re-serialized JSON body would break signature verification), and the RPC that marks an order paid is revoked from every role except `service_role`, so a regular signed-in user cannot call it directly to fraudulently mark their own order paid.
- **Storage bucket** (`delivery-proofs`) is private, with RLS scoped by path convention back to the actual delivery/order/shop relationship — no cross-tenant photo access.
- **Driver invite codes**: ~4.3 billion possible codes, 14-day expiry, regenerable, and brute-forcing them means hitting Supabase's own signup rate limit on every guess (see "Needs your action" below to confirm that's still on).

---

## Fixed tonight (code-level)

| # | Finding | Severity | What I did |
|---|---|---|---|
| 1 | **The public tracking link never actually worked for its intended audience.** `orders_select` RLS requires you to be the order's own logged-in customer, the owning merchant, or the assigned driver. Since merchant-entered orders (the only order path actually wired up) always set `customer_id = null`, an anonymous visitor — exactly who a "here's your tracking link, no login needed" text is sent to — got zero rows back, every time. Not a leak; the opposite problem. | High (functional/trust) | Added two column-limited `SECURITY DEFINER` functions (`get_order_tracking`, `get_delivery_proof_for_tracking`) instead of widening RLS on the `orders` table itself — a table-level anon policy would leak *every* column (total price, phone number, etc.) to anyone who found a valid order id, not just the tracking page. Rewired the tracking page to use these, and swapped the Realtime subscription (which silently never fires for a visitor with no session) for 15-second polling. New migration: `sql/017_public_tracking.sql`. |
| 2 | **4 (now down to 3) high-severity npm vulnerabilities**, via `npm audit`: DoS and SSRF in Next.js Server Actions, cache-confusion between requests, and an unauthenticated internal-endpoint disclosure bug — all in Next.js 15.5.20. | High | Bumped Next.js to 15.5.23 (patch release, same major/minor) and ran `npm audit fix` for the rest. Confirmed clean with `tsc`/`eslint` after. |
| 3 | Remaining 3 `npm audit` findings (`postcss`, `sharp`) | Low in practice | These are pulled in by Next's image-optimization pipeline; the app never uses `next/image`, so the actual attack surface is close to zero. Full fix needs Next 16 (a major version bump) — didn't do this blind since I can't run a real build in this sandbox to verify nothing broke. Flagging for you to do on your own time with a working dev environment. |
| 4 | Password minimum was 6 characters (matches Supabase's default, which is low for accounts that can end up handling real Stripe payment links) | Low-Medium | Raised the login form's `minLength` to 8. **This alone doesn't enforce anything** — it's a client-side hint only, trivially bypassed by anyone calling the API directly. The real fix is a dashboard setting (below). |
| 5 | No security headers at all — there was no `next.config` file, so nothing set `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, or `Permissions-Policy`. | Medium | Added `frontend/next.config.ts` with the zero-risk headers (clickjacking protection, MIME-sniff protection, referrer trimming, and locking off camera/mic/payment/usb APIs the app never uses while explicitly keeping geolocation available since the driver app now uses it). Deliberately did **not** add a Content-Security-Policy — a wrong CSP fails silently and I have no way to click through the deployed site and watch for console violations from this sandbox. Worth adding once you can test it. |

---

## Needs your action (I can't do these from here)

| # | Item | Why it matters |
|---|---|---|
| 1 | **Re-enable email confirmation** in Supabase Auth (currently off "for testing convenience" per the README's own known-limitations note). | With it off, anyone can sign up using an email address they don't own — including impersonating a real customer or, worse, registering a merchant account under someone else's email as your product gets real usage. This is the single most important item on this list. |
| 2 | **Raise the minimum password length** in Supabase Dashboard → Authentication → Policies (currently defaults to 6). Match or exceed the 8 I set client-side. | The client-side `minLength` I added does nothing against a direct API call — Supabase's own setting is the actual enforcement point. |
| 3 | **Confirm Authentication → Rate Limits hasn't been loosened or disabled.** The invite-code security model explicitly depends on Supabase's platform-level signup rate limiting (documented in `sql/014`'s own comments) rather than a second rate limiter built into Postgres. If that's off, the ~4.3 billion invite-code keyspace stops being the real protection. | Same reason as the invite-code math above — the entropy only matters if guesses are throttled. |
| 4 | **Verify there's no permissive `UPDATE` policy on `profiles`** allowing a user to change their own `role` or `merchant_id` directly (e.g. via a raw `PATCH` to the Supabase REST API, bypassing the app entirely). I could not verify this from code — the base `profiles` table (like a few others) was created directly in the Supabase dashboard rather than through a tracked migration, so its full policy set isn't in this repo. Check: Dashboard → Authentication → Policies → `profiles`. | If this exists, anyone with a free account could self-promote to `merchant` on an existing shop, or claim another shop's `merchant_id`, entirely outside anything this codebase controls. I found no evidence such a policy exists (there's no `profiles.update()` call anywhere in the frontend, which is a good sign, but doesn't rule out a raw API call), so treat this as "please confirm" rather than "known broken." |
| 5 | **Run the two new migrations** in the Supabase SQL editor, in order: `sql/016_delivery_proof_geolocation.sql` (from earlier tonight — adds real GPS capture to delivery proof) and `sql/017_public_tracking.sql` (tonight's tracking-link fix). Neither is live until you run them. |
| 6 | **Consider enabling Supabase's built-in CAPTCHA** (hCaptcha or Turnstile, both supported out of the box in Auth settings) on signup/login once you're taking real signups — extra brute-force/bot resistance beyond the default rate limits, cheap to turn on. |
| 7 | **Next.js major version (16)** — clears the remaining 3 `npm audit` findings. Low urgency given the app doesn't use `next/image`, but worth scheduling with a real test pass. |

---

## What I couldn't test

I don't have network access to your live Supabase project from this environment (the sandbox's outbound proxy only allows an explicit allowlist, and `*.supabase.co` isn't on it), so everything above is static analysis — reading the actual policy/function definitions, not firing requests at the live API. That's actually the more rigorous method for confirming RLS logic (I can see exactly what's enforced, not just infer it from behavior), but it does mean I couldn't empirically confirm items 3 and 4 above. If you want a live black-box pass too, the standalone check worth running is: with just your public anon key (already public by design — it's shipped in the browser bundle), try `GET` on `/rest/v1/profiles`, `/rest/v1/merchants`, and `/rest/v1/delivery_proofs` with no `Authorization` header. All three should come back empty. Supabase's own Dashboard → Advisors → Security page will also flag any RLS-disabled tables automatically and is worth a look now that a second shop's worth of real data may show up.

---

## Update: critical finding from Supabase's linter

You ran the Advisor scan yourself and pasted the output back. Real value in doing that — it caught something my code review missed, and it's worth explaining exactly how, because the gap says something about the limits of reading code versus checking the actual live system.

### The finding: `_mark_order_paid` was callable by anyone, signed in or not

In Postgres, **every newly created function grants `EXECUTE` to `PUBLIC` by default**, unless you explicitly `REVOKE` it. `sql/015_payments.sql` created `public._mark_order_paid(p_order_id uuid)` as what its own comment calls "an internal helper" meant to only ever be reached through `mark_order_paid_manually()` (checks `is_merchant()` + shop ownership) or `mark_order_paid_from_stripe()` (locked to `service_role` only). The comment said "no grants on this one" — true in the sense that nothing *explicitly* granted it anything, but that's not the same as nothing being able to call it. Because it was never explicitly revoked, the implicit default `PUBLIC` grant was still sitting there.

`_mark_order_paid` itself has **zero authorization checks in its body** — no `auth.uid()` check, no ownership check, nothing. That was fine as long as only the two gatekeeper functions could reach it. But with the default grant never revoked, it was directly callable at `POST /rest/v1/rpc/_mark_order_paid` by literally anyone — no login required — with any order id, marking any shop's order paid with no actual payment involved. That's a real, working exploit: an attacker (or a curious competitor) could have marked their own unpaid order as paid, or vandalized another shop's order records, for free, no Stripe, no account.

**Why I missed it:** I read the function's body and the surrounding comments and reasoned about what the code *says*. The bug isn't in what it says — it's in a Postgres default the code never overrides, which only shows up when you check actual grants against the live database (which is exactly what Supabase's linter does, and what I couldn't do from this sandbox). This is the difference between code review and a live security scan: they catch different classes of bugs, and neither replaces the other. Good instinct running it.

### The fix: `sql/018_lock_down_function_grants.sql`

Explicitly revokes the implicit `PUBLIC` grant (which includes `anon`) from:
- `_mark_order_paid` — the critical one, now unreachable directly by anyone
- Every internal helper/predicate function that RLS policies use internally but was never meant to be called directly (`is_merchant`, `my_merchant_id`, `is_order_driver`, `owns_order`, `order_belongs_to_my_merchant`, `merchant_can_read_profile`, `handle_new_user`) — none of these were exploitable the way `_mark_order_paid` was (they either have no side effects or, for `handle_new_user`, Postgres won't even let you call a trigger function directly), but there's no reason for them to be part of the public API surface either
- The six write RPCs that already correctly reject anonymous callers via their own internal `is_merchant()`/`auth.uid()` checks (`create_order`, `merchant_create_order`, `assign_driver`, `update_order_status`, `mark_order_paid_manually`, `regenerate_invite_code`) — these were never actually exploitable by anon (their own logic already turned those calls away), but they shouldn't have been depending on that internal check alone to do a grant's job. Now explicitly scoped to `authenticated` only.

**Run `sql/018` in the Supabase SQL editor now** — this is the one migration on the list that closes an actively exploitable hole, not a hardening-for-later item.

### One more from the linter: leaked password protection

The scan also flagged `auth_leaked_password_protection` as disabled — a free Supabase Auth feature that checks new passwords against the HaveIBeenPwned breach database at signup. Turn it on: Dashboard → Authentication → Policies (or Auth settings, depending on your Supabase version) → Password Security. Costs nothing, catches the "password123" problem before it becomes an account.

### Confirmed fixed: second scan after running `sql/018`

You ran the Advisor a second time after applying `sql/018` and pasted the results back. Confirms the fix landed clean:

- **`_mark_order_paid` no longer appears anywhere in the report.** The exploitable path is closed — it's no longer reachable via `/rest/v1/rpc/_mark_order_paid` by anyone.
- **All seven internal helper functions are gone from both lists too** (`is_merchant`, `my_merchant_id`, `is_order_driver`, `owns_order`, `order_belongs_to_my_merchant`, `merchant_can_read_profile`, `handle_new_user`) — the revokes took effect exactly as written.
- **What's still flagged is exactly what should be flagged**, nothing new:
  - `get_order_tracking` / `get_delivery_proof_for_tracking` showing up under both `anon` and `authenticated` — intentional, that's the entire point of `sql/017`, no action needed.
  - `create_order`, `merchant_create_order`, `assign_driver`, `update_order_status`, `mark_order_paid_manually`, `regenerate_invite_code` showing up under `authenticated` only (no longer under `anon`, unlike the first scan) — also intentional. These are meant to be called by signed-in users; each one checks `is_merchant()`/`auth.uid()`/ownership internally before doing anything. The linter can't know that from the outside, so it flags every `authenticated`-callable `SECURITY DEFINER` function as a generic "make sure this is intentional" — this is that confirmation.
  - `auth_leaked_password_protection` — still open, still just the one dashboard toggle from the section above.

Nothing left to fix in code from this pass. The one remaining action item is the password-protection toggle.
