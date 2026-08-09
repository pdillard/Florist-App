'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { STATUS_STYLES } from '@/components/shared/StatusBadge'

type Order = {
  id: string
  status: string
  recipient_name: string | null
  delivery_address: string
  total_cents: number
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Order received',
  confirmed: 'Confirmed',
  assigned: 'Driver assigned',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  failed: 'Delivery failed',
  cancelled: 'Cancelled',
}

export default function TrackOrderPage() {
  const params = useParams<{ orderId: string }>()
  const orderId = params.orderId

  const [order, setOrder] = useState<Order | null>(null)
  const [proofUrl, setProofUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    async function loadProof() {
      const { data: delivery } = await supabase
        .from('deliveries')
        .select('id')
        .eq('order_id', orderId)
        .single()

      if (!delivery) return

      const { data: proof } = await supabase
        .from('delivery_proofs')
        .select('photo_url')
        .eq('delivery_id', delivery.id)
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .single()

      if (!proof) return

      const { data: signed } = await supabase.storage
        .from('delivery-proofs')
        .createSignedUrl(proof.photo_url, 60 * 60)

      if (active && signed) setProofUrl(signed.signedUrl)
    }

    async function load() {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, recipient_name, delivery_address, total_cents')
        .eq('id', orderId)
        .single()

      if (!active) return

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setOrder(data)
      setLoading(false)

      if (data.status === 'delivered') {
        await loadProof()
      }
    }

    load()

    // Live updates: no polling, no manual refresh needed. Requires orders
    // to be added to the supabase_realtime publication (see
    // sql/010_enable_realtime_orders.sql) or this subscribes successfully
    // but never actually receives anything.
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          const updated = payload.new as Order
          setOrder(updated)
          if (updated.status === 'delivered') {
            loadProof()
          }
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [orderId])

  if (loading) {
    return <main className="p-8">Loading...</main>
  }

  if (error || !order) {
    return (
      <main className="p-8">
        <p className="text-red-600">
          {error ?? 'Order not found, or you do not have access to view it.'}
        </p>
      </main>
    )
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-2">Track your order</h1>
      <p className="mb-6 text-gray-500">
        {order.recipient_name} — {order.delivery_address}
      </p>

      <div
        className={`rounded-lg border p-6 ${
          (STATUS_STYLES[order.status] ?? '').split(' ')[0]
        }`}
      >
        <p className="text-lg font-semibold">{STATUS_LABELS[order.status] ?? order.status}</p>
        <p className="mt-1 text-sm text-gray-600">
          This page updates automatically, no need to refresh.
        </p>
      </div>

      {proofUrl && (
        <div className="mt-6">
          <p className="mb-2 font-semibold">Proof of delivery</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={proofUrl} alt="Proof of delivery" className="max-w-sm rounded-lg border" />
        </div>
      )}
    </main>
  )
}
