'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, Navigation, RadioTower } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { OrderProgress } from '@/components/shared/OrderProgress'

type Order = {
  id: string
  status: string
  recipient_name: string | null
  delivery_address: string
}

const TERMINAL_STATUSES = ['delivered', 'failed', 'cancelled']
const POLL_INTERVAL_MS = 15_000

export default function TrackOrderPage() {
  const params = useParams<{ orderId: string }>()
  const orderId = params.orderId

  const [order, setOrder] = useState<Order | null>(null)
  const [proofUrl, setProofUrl] = useState<string | null>(null)
  const [proofLocation, setProofLocation] = useState<{
    lat: number
    lng: number
    accuracy: number | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tracks whether a proof fetch has already run this session, so a poll
  // tick doesn't re-request the (signed, already-fetched) photo URL every
  // 15 seconds once it's delivered.
  const proofFetchedRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    let active = true
    let timer: ReturnType<typeof setTimeout> | null = null

    async function loadProof() {
      if (proofFetchedRef.current) return
      proofFetchedRef.current = true

      const res = await fetch(`/api/track/${orderId}/proof`)
      if (!active || !res.ok) return

      const data = await res.json()
      setProofUrl(data.url)
      if (data.lat != null && data.lng != null) {
        setProofLocation({ lat: data.lat, lng: data.lng, accuracy: data.accuracy })
      }
    }

    // This page is explicitly meant to work with no login - a link a shop
    // sends to whoever's receiving the flowers. orders_select (sql/006)
    // has no anon path (and shouldn't - see sql/017's comment for why a
    // wider table-level policy would leak more than intended), so this
    // calls a column-limited SECURITY DEFINER function instead of
    // querying the table directly. That function is what actually decides
    // what's real; there's nothing to trick client-side by knowing the id.
    async function load() {
      const { data: rawData, error } = await supabase
        .rpc('get_order_tracking', { p_order_id: orderId })
        .maybeSingle()

      if (!active) return

      if (error || !rawData) {
        setError(error?.message ?? null)
        setLoading(false)
        return
      }

      const data = rawData as Order
      setOrder(data)
      setLoading(false)

      if (TERMINAL_STATUSES.includes(data.status)) {
        if (data.status === 'delivered') await loadProof()
        return
      }

      // Realtime's postgres_changes authorization checks the same RLS the
      // direct table query above can't get past for an anonymous visitor,
      // so a push subscription here would silently never fire for anyone
      // without a session. Short-interval polling instead - imperceptible
      // for something that changes a handful of times over a delivery's
      // lifecycle, and it works identically whether or not the visitor is
      // signed in.
      timer = setTimeout(load, POLL_INTERVAL_MS)
    }

    load()

    return () => {
      active = false
      if (timer) clearTimeout(timer)
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
            {proofLocation && (
              <a
                href={`https://www.google.com/maps?q=${proofLocation.lat},${proofLocation.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-rose-600 transition-colors hover:text-rose-800 hover:underline"
              >
                <Navigation className="h-3.5 w-3.5" />
                View GPS location of delivery
              </a>
            )}
          </motion.div>
        )}
      </motion.div>
    </main>
  )
}
