# Florist Delivery Platform

A delivery operations platform for local merchants (launching with florists): a merchant enters an
order, assigns a driver, the driver delivers with photo proof, and the customer tracks it live.
Delivery, tracking, and proof-of-delivery are the product, not a bolt-on to a POS.

## Stack

- **Database / Auth / Storage / Realtime**: Supabase (hosted Postgres, RLS-based authorization)
- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind, in `frontend/`
- **Payments / SMS**: Stripe and Twilio are designed for but not wired up yet, both need real
  API keys before they can do anything (see `frontend/src/app/api/webhooks/stripe/route.ts`)

## Local setup

1. `cd frontend && npm install`
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase project URL and anon key
   (Supabase dashboard → Settings → API). Restart the dev server after editing this file, it's
   only read at startup.
3. In the Supabase SQL Editor, run every file in `sql/` **in numeric order** (001, 002, 003...).
   Each one is a real migration against the live schema, not just documentation, running them out
   of order or skipping one will break things.
4. `npm run dev`

## Roles

Three roles, chosen at signup: `customer`, `merchant`, `driver`. A merchant signing up becomes
the owner of a shop (`merchants` table); every merchant/driver account is scoped to one shop via
`profiles.merchant_id`. Multi-shop signup (a second real shop signing up on its own) isn't built
yet, onboarding a second shop today requires a manual SQL insert, see `sql/005_multi_tenancy_schema.sql`.

## Known limitations (v1)

- **No payments.** Orders are created `unpaid`, merchants collect payment outside the app.
- **No SMS.** Status changes are visible in the app (dashboard, driver app, tracking page), not
  pushed via text.
- **Single shop only.** The schema supports multiple shops, but the signup flow to onboard a
  second one isn't built.
- **`profiles` isn't fully isolated across shops** for signed-in users (see
  `sql/011_profiles_require_auth.sql`), only anonymous access is blocked. Fix before onboarding
  a second real shop.
- Email confirmation is disabled in Supabase Auth for testing convenience. **Re-enable before
  accepting real signups.**

## Deploying (Vercel)

1. Push this repo to GitHub if it isn't already there.
2. In Vercel, "Add New Project" → import the repo → set the **root directory to `frontend`**
   (the Next.js app isn't at the repo root).
3. Add the two environment variables from `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project's Settings → Environment Variables.
4. Deploy. Every `git push` to the connected branch redeploys automatically after this.

## Repo layout

```
frontend/          Next.js app
sql/                Every database migration, in order, run against Supabase directly
```
