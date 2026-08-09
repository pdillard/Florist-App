import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/service'

// Verifies the signature with the RAW request body - request.text(), not
// request.json(). Stripe signs the exact bytes it sent; parsing to JSON
// and re-serializing (even losslessly) can change whitespace/key order
// enough to break the signature check. Next's App Router route handlers
// don't parse the body until you call something on `request`, so this
// works with no extra config (unlike the old Pages API's `bodyParser: false`).
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'missing stripe-signature header' }, { status: 400 })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not set, cannot verify webhook')
    return NextResponse.json({ error: 'webhook not configured' }, { status: 500 })
  }

  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'invalid signature'
    console.error('Stripe webhook signature verification failed:', message)
    return NextResponse.json({ error: `webhook signature verification failed: ${message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id

    if (!orderId) {
      // Shouldn't happen - every session we create sets this (api/checkout).
      // Log and 200 anyway: returning an error here just makes Stripe retry
      // a webhook that will never have an order_id, forever.
      console.error('checkout.session.completed with no order_id in metadata', session.id)
      return NextResponse.json({ received: true })
    }

    // Service-role client: there's no user session on a webhook request,
    // Stripe's signature (just verified above) is the authorization
    // instead. mark_order_paid_from_stripe (sql/015) is granted only to
    // service_role for exactly this reason.
    const supabase = createServiceClient()
    const { error } = await supabase.rpc('mark_order_paid_from_stripe', { p_order_id: orderId })

    if (error) {
      console.error('mark_order_paid_from_stripe failed:', orderId, error.message)
      // 500 so Stripe retries - a transient DB error shouldn't silently
      // leave an order that was actually paid stuck showing unpaid.
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // Every other event type: acknowledge without acting. Returning 200 for
  // events we don't handle is intentional - Stripe retries on non-2xx,
  // and we only listen for checkout.session.completed right now.
  return NextResponse.json({ received: true })
}
