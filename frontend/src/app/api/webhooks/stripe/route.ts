import { NextResponse } from 'next/server'

// Stripe isn't wired up yet, this needs a Stripe account, a secret key,
// and a webhook signing secret before it can do anything real. This stub
// exists so the file is a valid Next.js route module (an empty file broke
// the production build) rather than because it does anything yet.
//
// When this gets built for real: verify the signature with
// stripe.webhooks.constructEvent() using the raw request body (not
// request.json(), Stripe's signature check needs the exact raw bytes),
// then move the relevant order from pending to confirmed via
// update_order_status().
export async function POST() {
  return NextResponse.json(
    { error: 'Stripe webhook not configured yet' },
    { status: 501 }
  )
}
