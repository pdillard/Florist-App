import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MerchantNav } from '@/components/dashboard/MerchantNav'
import { OrderStatusPanel } from '@/components/dashboard/OrderStatusPanel'
import { PaymentPanel } from '@/components/dashboard/PaymentPanel'
import { OrderProgress } from '@/components/shared/OrderProgress'

// See the comment in (driver)/driver/page.tsx: without generated Supabase
// types, many-to-one embeds are inferred as arrays. These describe the
// real shapes returned at runtime.
type OrderItemRow = {
  id: string
  qty: number
  unit_price_cents: number
  product: { name: string } | null
}

type OrderEventRow = {
  id: string
  from_status: string | null
  to_status: string
  created_at: string
  actor: { name: string | null } | null
}

type DeliveryRow = {
  id: string
  driver_id: string | null
  picked_up_at: string | null
  delivered_at: string | null
  failure_reason: string | null
  driver: { name: string | null } | null
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'merchant') {
    redirect('/')
  }

  const [{ data: order }, { data: rawItems }, { data: rawEvents }, { data: rawDelivery }] =
    await Promise.all([
      supabase
        .from('orders')
        .select(
          'id, status, recipient_name, recipient_phone, delivery_address, card_message, total_cents, payment_status, created_at'
        )
        .eq('id', orderId)
        .single(),
      supabase
        .from('order_items')
        .select('id, qty, unit_price_cents, product:products(name)')
        .eq('order_id', orderId),
      supabase
        .from('order_events')
        .select('id, from_status, to_status, created_at, actor:profiles(name)')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true }),
      supabase
        .from('deliveries')
        .select(
          'id, driver_id, assigned_at, picked_up_at, delivered_at, failure_reason, driver:profiles!driver_id(name)'
        )
        .eq('order_id', orderId)
        .maybeSingle(),
    ])

  if (!order) {
    notFound()
  }

  const items = (rawItems ?? []) as unknown as OrderItemRow[]
  const events = (rawEvents ?? []) as unknown as OrderEventRow[]
  const delivery = rawDelivery as unknown as DeliveryRow | null

  return (
    <main className="p-8">
      <MerchantNav />

      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-rose-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to orders
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold">{order.recipient_name ?? 'Order'}</h1>
        <OrderStatusPanel orderId={order.id} initialStatus={order.status} />
      </div>

      <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
        <OrderProgress status={order.status} />
      </div>

      <div className="mb-6">
        <PaymentPanel
          orderId={order.id}
          initialPaymentStatus={order.payment_status}
          orderStatus={order.status}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-2 flex items-center gap-1.5 font-semibold">
            <MapPin className="h-4 w-4 text-rose-500" />
            Delivery
          </h2>
          <p className="text-sm">{order.delivery_address}</p>
          {order.recipient_phone && (
            <p className="text-sm text-gray-500">{order.recipient_phone}</p>
          )}
          {order.card_message && (
            <p className="mt-2 text-sm italic text-gray-600">&quot;{order.card_message}&quot;</p>
          )}

          {delivery && (
            <div className="mt-3 space-y-1 border-t pt-3 text-sm text-gray-600">
              <p>Driver: {delivery.driver?.name ?? 'Unnamed driver'}</p>
              {delivery.picked_up_at && (
                <p>Picked up: {new Date(delivery.picked_up_at).toLocaleString()}</p>
              )}
              {delivery.delivered_at && (
                <p>Delivered: {new Date(delivery.delivered_at).toLocaleString()}</p>
              )}
              {delivery.failure_reason && (
                <p className="text-red-600">Failed: {delivery.failure_reason}</p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-2 flex items-center gap-1.5 font-semibold">
            <Package className="h-4 w-4 text-rose-500" />
            Items
          </h2>
          <div className="space-y-1">
            {(items ?? []).map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.qty} x {item.product?.name ?? 'Unknown product'}
                </span>
                <span>${((item.qty * item.unit_price_cents) / 100).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
            <span>Total</span>
            <span>${(order.total_cents / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold">History</h2>
        <div className="space-y-3">
          {(events ?? []).map((event, i) => (
            <div key={event.id} className="flex items-start gap-3 text-sm">
              <div className="mt-1 flex flex-col items-center self-stretch">
                <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                {i < events.length - 1 && <span className="mt-1 w-px flex-1 bg-gray-200" />}
              </div>
              <p className="pb-3 text-gray-600">
                <span className="font-medium text-gray-900">
                  {event.from_status ?? 'created'} → {event.to_status}
                </span>
                <span className="block text-xs text-gray-400">
                  {new Date(event.created_at).toLocaleString()}
                  {event.actor?.name && ` · ${event.actor.name}`}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
