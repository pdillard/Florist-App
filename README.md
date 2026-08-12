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

## Onboarding a shop's catalog

The Inventory page (dashboard) has a bulk import above the single-item "Add product" form:
upload a CSV or paste directly from Excel/Google Sheets. Column headers are matched loosely
(`price`, `cost`, `unit price`, etc. all work), a name and a price column are the only
requirements, and re-importing updates existing products by matching on name (case-insensitive)
instead of creating duplicates. See `components/dashboard/BulkImportProducts.tsx`. This exists
because typing in a shop's full catalog by hand during onboarding is real friction that has
nothing to do with whether the product is good.

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

## Before going live

Everything above works today with zero external accounts beyond Supabase: signup/login, merchant
order entry, driver assignment and delivery, photo proof, and customer tracking are all fully
functional with no Stripe, Twilio, business registration, or domain required. What's actually
gated on those things, and what's not:

- **A domain is not required to deploy or test.** Vercel gives every project a free
  `<project>.vercel.app` URL the moment you deploy - `NEXT_PUBLIC_SITE_URL` can point at that.
  Buying a real domain later is a DNS change in Vercel plus updating that one env var, no code
  changes.
- **Stripe test mode needs an account, not a registered business.** Signing up for Stripe gives
  you test-mode API keys immediately - no EIN, no business verification, no bank account. That's
  enough to build and fully exercise the payment-link → webhook → order-marked-paid flow end to
  end before anything is real. (Flagging this in case it changes the order you want to do things
  in - happy to leave it alone if you'd rather wait regardless.)
- **Business registration and bank details are only needed to activate Stripe for live payouts** -
  i.e. to actually receive real money. Stripe asks for legal business info (an EIN/SSN depending
  on entity type), a bank account, and typically a business URL at that point. This is the actual
  gate on charging real customers, not on writing or testing the code.
- **Twilio** similarly just needs an account and a phone number, no business registration, to test
  SMS in a trial account (trial accounts can only text verified numbers until upgraded).
- **Re-enable email confirmation** in Supabase Auth before any real signups - it's off right now
  for testing convenience (see Known limitations above).

Net: nothing in the current build is blocked on the business/domain side. When you're ready,
swapping in real Stripe/Twilio keys and a domain is a config change, not a code change.

## Repo layout

```
frontend/          Next.js app
sql/                Every database migration, in order, run against Supabase directly
```
