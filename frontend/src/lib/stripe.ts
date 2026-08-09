import Stripe from 'stripe'

let cached: Stripe | null = null

// Lazy, not constructed at import time. Next's build step ("Collecting
// page data") imports every route module just to analyze it - that runs
// this file's top-level code even though the route handler itself never
// executes. A module-level `throw` (or `new Stripe(...)` on an undefined
// key) there fails the entire `next build`/Vercel deploy before
// STRIPE_SECRET_KEY has even been set, not just requests to routes that
// need it (this is exactly what broke the first deploy). Constructing the
// client on first actual call defers the missing-key error to request
// time, where it belongs - the build succeeds either way, and only
// hitting /api/checkout or the webhook without a key set returns a clear
// error instead of failing silently.
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Add it to frontend/.env.local (see .env.local.example).'
    )
  }

  if (!cached) {
    cached = new Stripe(process.env.STRIPE_SECRET_KEY)
  }

  return cached
}
