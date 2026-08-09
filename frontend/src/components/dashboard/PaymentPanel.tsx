'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'

export function PaymentPanel({
  orderId,
  initialPaymentStatus,
  orderStatus,
}: {
  orderId: string
  initialPaymentStatus: string
  orderStatus: string
}) {
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus)
  const [paymentLink, setPaymentLink] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Whoever actually pays (the customer, on their own device, off a link
  // the merchant texted or emailed them) isn't the merchant looking at
  // this page. Subscribe so payment_status flips to "paid" here the
  // moment the webhook writes it, no manual refresh needed - same pattern
  // as the customer tracking page (sql/010_enable_realtime_orders.sql).
  useEffect(() => {
    const channel = supabase
      .channel(`order-payment-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          const updated = payload.new as { payment_status: string }
          setPaymentStatus(updated.payment_status)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, supabase])

  async function getPaymentLink() {
    setGenerating(true)
    setError(null)

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
    const body = await res.json()

    setGenerating(false)

    if (!res.ok) {
      setError(body.error ?? 'could not create a payment link')
      return
    }

    setPaymentLink(body.url)
  }

  async function copyLink() {
    if (!paymentLink) return
    await navigator.clipboard.writeText(paymentLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function markPaidManually() {
    if (!confirm('Mark this order as paid? Only do this if payment was actually collected (cash, card in person, etc.).')) {
      return
    }

    setMarkingPaid(true)
    setError(null)

    const { error } = await supabase.rpc('mark_order_paid_manually', { p_order_id: orderId })

    setMarkingPaid(false)

    if (error) {
      setError(error.message)
      return
    }

    setPaymentStatus('paid')
  }

  if (paymentStatus === 'paid') {
    return (
      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
        Paid
      </span>
    )
  }

  if (orderStatus === 'cancelled') {
    return (
      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">
        Unpaid (cancelled)
      </span>
    )
  }

  return (
    <div className="rounded border bg-gray-50 p-3">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
          Unpaid
        </span>
        <Button variant="secondary" onClick={getPaymentLink} loading={generating} type="button">
          Get payment link
        </Button>
        <Button variant="ghost" onClick={markPaidManually} loading={markingPaid} type="button">
          Mark as paid manually
        </Button>
      </div>

      {paymentLink && (
        <div className="mt-2 flex items-center gap-2">
          <input
            readOnly
            value={paymentLink}
            onFocus={(e) => e.target.select()}
            className="w-full min-w-0 flex-1 rounded border bg-white px-2 py-1 text-xs"
          />
          <Button variant="secondary" onClick={copyLink} type="button">
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
