'use client'

import { useState } from 'react'
import { Camera, MessageSquareWarning, Phone, Truck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/shared/Button'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { INPUT_STYLES } from '@/lib/ui'

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

// A colored left edge per status - a driver scanning a list of cards on
// their phone can tell "needs action" from "already moving" at a glance,
// without reading every badge.
const STATUS_ACCENT: Record<string, string> = {
  assigned: 'border-l-indigo-500',
  out_for_delivery: 'border-l-purple-500',
}

export function DeliveryCard({ delivery }: { delivery: Delivery }) {
  // Status lives in local state and updates the moment the server confirms
  // the change, instead of waiting on router.refresh() to re-fetch the
  // whole page just to learn the value we already just set.
  const [status, setStatus] = useState(delivery.order?.status ?? 'assigned')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [failureReason, setFailureReason] = useState('')
  const [showFailureInput, setShowFailureInput] = useState(false)
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
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    setStatus('out_for_delivery')
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

    setSubmitting(false)

    if (statusError) {
      setError(statusError.message)
      return
    }

    setStatus('delivered')
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
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    setStatus('failed')
  }

  return (
    <div
      className={`rounded-xl border border-l-4 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md ${
        STATUS_ACCENT[status] ?? 'border-l-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{order.recipient_name ?? '—'}</p>
          <p className="mt-0.5 text-sm text-gray-500">{order.delivery_address}</p>
          {order.recipient_phone && (
            <a
              href={`tel:${order.recipient_phone}`}
              className="mt-0.5 flex items-center gap-1 text-sm text-gray-500 hover:text-rose-600"
            >
              <Phone className="h-3.5 w-3.5" />
              {order.recipient_phone}
            </a>
          )}
          {order.card_message && (
            <p className="mt-1 text-sm italic text-gray-600">&quot;{order.card_message}&quot;</p>
          )}
        </div>
        <StatusBadge status={status} />
      </div>

      {error && (
        <div className="mt-2">
          <ErrorMessage>{error}</ErrorMessage>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {status === 'assigned' && (
          <Button onClick={handleStartDelivery} loading={submitting}>
            <Truck className="h-4 w-4" />
            Start delivery
          </Button>
        )}

        {status === 'out_for_delivery' && (
          <>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md active:translate-y-0 active:scale-[0.97]">
              <Camera className="h-4 w-4" />
              {submitting ? 'Uploading...' : 'Upload proof photo'}
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
                className="inline-flex items-center gap-1.5 text-sm text-red-600 underline decoration-red-200 underline-offset-2 transition-colors hover:text-red-800 hover:decoration-red-800"
              >
                <MessageSquareWarning className="h-3.5 w-3.5" />
                Report failed delivery
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  className={INPUT_STYLES}
                  placeholder="Reason"
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                />
                <Button
                  variant="danger"
                  onClick={handleReportFailure}
                  loading={submitting}
                  className="border-transparent bg-red-600 text-white hover:bg-red-700"
                >
                  Confirm failed
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
