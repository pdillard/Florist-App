# Florist Delivery Platform

A delivery operations platform for local merchants (launching with florists): a merchant enters an
order, assigns a driver, the driver delivers with photo proof, and the customer tracks it live.
Delivery, tracking, and proof-of-delivery are the product - this is an add-on that sits next to a
shop's existing storefront/POS (Floranext, Square, phone/walk-in), not a replacement for one.
There is deliberately no customer-facing storefront here; orders come in however the shop already
takes them and get entered via the merchant dashboard.

## Stack

- **Database / Auth / Storage / Realtime**: Supabase (hosted Postgres, RLS-based authorization)
- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind, in `frontend/`
- **Payments**: Stripe Checkout. A merchant generates a payment link from an order's detail page
  and sends it to whoever's paying; the webhook (`frontend/src/app/api/webhooks/stripe/route.ts`)
  marks the order paid. See `sql/015_payments.sql`. Needs real API keys to do anything (see
  `.env.local.example`) - without them the checkout/webhook routes throw a clear error rather than
  failing silently.
- **SMS**: Twilio is designed for but not wired up yet.

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

Three roles, chosen at signup: `customer`, `merchant`, `driver`. A merchant signing up creates
their own shop (`merchants` table) on the spot, no invite needed. A driver signing up must enter
an existing shop's invite code (shown to the merchant on the Drivers dashboard page, and
regenerable there); this is what scopes `profiles.merchant_id` for driver accounts and stops
anyone from attaching themselves to a shop's roster without that shop's say-so. Codes expire 14
days after being issued or regenerated. Customers aren't scoped to a single shop; there's no
self-serve customer signup path in practice today since there's no storefront for them to order
from - a customer account only has content once a shop links an order to it, which isn't wired up
yet. See `sql/012_merchant_signup_and_driver_invites.sql` and `sql/014_invite_code_expiry.sql`.

## Known limitations (v1)

- **No SMS.** Status changes are visible in the app (dashboard, driver app, tracking page), not
  pushed via text.
- **Driver assignment isn't gated on payment.** A merchant can assign a driver and deliver an
  unpaid order (COD, invoiced accounts, etc. are still real workflows). Getting paid and getting
  delivered are two independent tracks on purpose - tightening that is a product decision, not
  a bug.
- Email confirmation is disabled in Supabase Auth for testing convenience. **Re-enable before
  accepting real signups.**

## Deploying (Vercel)

1. Push this repo to GitHub if it isn't already there.
2. In Vercel, "Add New Project" → import the repo → set the **root directory to `frontend`**
   (the Next.js app isn't at the repo root).
3. Add every variable from `.env.local` in the Vercel project's Settings → Environment Variables
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL` set to the real deployed
   URL). Use Stripe's live keys and a live-mode webhook endpoint for production, not test-mode
   ones.
4. In the Stripe dashboard, add a webhook endpoint pointing at
   `https://<your-domain>/api/webhooks/stripe`, subscribed to `checkout.session.completed`, and
   copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Deploy. Every `git push` to the connected branch redeploys automatically after this.

## Repo layout

```
frontend/          Next.js app
sql/                Every database migration, in order, run against Supabase directly
```
