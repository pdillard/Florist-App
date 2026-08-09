import Stripe from 'stripe'

// Server-only. STRIPE_SECRET_KEY has no NEXT_PUBLIC_ prefix, so it's never
// bundled into client code - importing this file from a client component
// would fail at build time, which is the point.
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    'STRIPE_SECRET_KEY is not set. Add it to frontend/.env.local (see .env.local.example).'
  )
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
