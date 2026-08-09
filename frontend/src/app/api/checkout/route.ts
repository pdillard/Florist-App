import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

// Creates a Stripe Checkout Session for one order and hands back its URL.
// Called from the merchant dashboard's order detail page (PaymentPanel) -
// there's no self-serve customer checkout in this app (see README), so
// this is a payment LINK a merchant generates and sends to whoever's
// paying, not a page a customer lands on mid-purchase.
export async function POST(request: NextRequest) {
  const { orderId } = await request.json()

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'not signed in' }, { status: 401 })
  }

  // Plain select, not service-role: RLS (orders_select, sql/006) already
  // restricts this to the merchant's own shop, so a merchant can't
  // generate a payment link for another shop's order just by guessing an
  // order id.
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, recipient_name, total_cents, payment_status, status')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'order not found' }, { status: 404 })
  }

  if (order.payment_status === 'paid') {
    return NextResponse.json({ error: 'this order is already paid' }, { status: 409 })
  }

  if (order.status === 'cancelled') {
    return NextResponse.json({ error: 'this order is cancelled' }, { status: 409 })
  }

  if (!order.total_cents || order.total_cents <= 0) {
    return NextResponse.json({ error: 'order has no total to charge' }, { status: 409 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Flower delivery${order.recipient_name ? ` for ${order.recipient_name}` : ''}`,
          },
          // total_cents is server-computed by create_order()/merchant_create_order()
          // (sql/007) from each product's real price, never trusted from
          // the client - this just passes that already-verified number
          // through to Stripe.
          unit_amount: order.total_cents,
        },
        quantity: 1,
      },
    ],
    // The webhook (api/webhooks/stripe) reads this back out of the
    // checkout.session.completed event to know which order to mark paid.
    metadata: { order_id: order.id },
    success_url: `${siteUrl}/dashboard/orders/${order.id}?paid=1`,
    cancel_url: `${siteUrl}/dashboard/orders/${order.id}`,
  })

  if (!session.url) {
    return NextResponse.json({ error: 'stripe did not return a checkout url' }, { status: 502 })
  }

  return NextResponse.json({ url: session.url })
}
