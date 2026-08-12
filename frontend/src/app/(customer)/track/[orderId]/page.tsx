'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, RadioTower } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { OrderProgress } from '@/components/shared/OrderProgress'

type Order = {
  id: string
  status: string
  recipient_name: string | null
  delivery_address: string
  total_cents: number
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
    return (
      <main className="mx-auto max-w-lg px-8 py-20">
        <div className="skeleton h-6 w-48 rounded" />
        <div className="skeleton mt-3 h-4 w-64 rounded" />
        <div className="skeleton mt-8 h-32 rounded-2xl" />
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className="mx-auto max-w-lg px-8 py-20 text-center">
        <p className="text-red-600">
          {error ?? 'Order not found, or you do not have access to view it.'}
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-lg px-8 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold">Track your delivery</h1>
        <p className="mt-1 flex items-center gap-1.5 text-gray-500">
          <MapPin className="h-4 w-4 shrink-0 text-rose-500" />
          {order.recipient_name} &mdash; {order.delivery_address}
        </p>

        <div className="mt-8 rounded-2xl border bg-white p-6 shadow-lg shadow-rose-100/50">
          <OrderProgress status={order.status} />

          <div className="mt-6 flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
            <RadioTower className="h-3.5 w-3.5 shrink-0 text-rose-500" />
            This page updates automatically, no need to refresh.
          </div>
        </div>

        {proofUrl && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-6 rounded-2xl border bg-white p-4 shadow-sm"
          >
            <p className="mb-2 font-semibold">Proof of delivery</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={proofUrl} alt="Proof of delivery" className="w-full rounded-lg border" />
          </motion.div>
        )}
      </motion.div>
    </main>
  )
}
