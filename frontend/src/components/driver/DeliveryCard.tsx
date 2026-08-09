'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/shared/StatusBadge'

type Order = {
  id: string
  status: string
  recipient_name: string | null
  recipient_phone: string | null
  delivery_address: string
  card_message: string | null
}

type Delivery = {
  id: string
  order_id: string
  order: Order | null
}

export function DeliveryCard({ delivery }: { delivery: Delivery }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [failureReason, setFailureReason] = useState('')
  const [showFailureInput, setShowFailureInput] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const order = delivery.order
  if (!order) return null

  async function handleStartDelivery() {
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.rpc('update_order_status', {
      p_order_id: order!.id,
      p_new_status: 'out_for_delivery',
    })
    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }
    setSubmitting(false)
    router.refresh()
  }

  // Uploading a photo doubles as the "mark delivered" action, since the
  // state machine requires a delivery_proofs row to exist before it will
  // allow the delivered transition, so there's no separate button for it.
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setSubmitting(true)
    setError(null)

    const path = `${delivery.id}/${Date.now()}-${file.name}`

    const { data: userData } = await supabase.auth.getUser()

    const { error: uploadError } = await supabase.storage
      .from('delivery-proofs')
      .upload(path, file)

    if (uploadError) {
      setError(uploadError.message)
      setSubmitting(false)
      return
    }

    const { error: insertError } = await supabase.from('delivery_proofs').insert({
      delivery_id: delivery.id,
      photo_url: path,
      uploaded_by: userData.user?.id ?? null,
    })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    const { error: statusError } = await supabase.rpc('update_order_status', {
      p_order_id: order!.id,
      p_new_status: 'delivered',
    })

    if (statusError) {
      setError(statusError.message)
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    router.refresh()
  }

  async function handleReportFailure() {
    if (!failureReason.trim()) {
      setError('Enter a reason')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.rpc('update_order_status', {
      p_order_id: order!.id,
      p_new_status: 'failed',
      p_failure_reason: failureReason,
    })
    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }
    setSubmitting(false)
    router.refresh()
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold">{order.recipient_name ?? '—'}</p>
          <p className="text-sm text-gray-500">{order.delivery_address}</p>
          {order.recipient_phone && (
            <p className="text-sm text-gray-500">{order.recipient_phone}</p>
          )}
          {order.card_message && (
            <p className="mt-1 text-sm italic text-gray-600">&quot;{order.card_message}&quot;</p>
          )}
        </div>
        <StatusBadge status={order.status} />
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {order.status === 'assigned' && (
          <button
            onClick={handleStartDelivery}
            disabled={submitting}
            className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            Start delivery
          </button>
        )}

        {order.status === 'out_for_delivery' && (
          <>
            <label className="cursor-pointer rounded border px-3 py-1.5 text-sm">
              Upload proof photo
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={submitting}
                className="hidden"
              />
            </label>
            {!showFailureInput ? (
              <button
                onClick={() => setShowFailureInput(true)}
                className="text-sm text-red-600 underline"
              >
                Report failed delivery
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  className="rounded border p-1.5 text-sm"
                  placeholder="Reason"
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                />
                <button
                  onClick={handleReportFailure}
                  disabled={submitting}
                  className="rounded bg-red-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                >
                  Confirm failed
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
