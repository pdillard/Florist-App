'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/shared/StatusBadge'

export function OrderStatusPanel({
  orderId,
  initialStatus,
}: {
  orderId: string
  initialStatus: string
}) {
  // Owns status locally so cancelling updates the badge and hides the
  // button immediately, no full page refetch needed for a one-field change.
  const [status, setStatus] = useState(initialStatus)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Matches the legal transitions in update_order_status(): only these
  // three states can still be cancelled, once a driver has actually
  // picked something up the only outcomes left are delivered or failed.
  const cancellable = ['pending', 'confirmed', 'assigned'].includes(status)

  async function handleCancel() {
    if (!confirm('Cancel this order?')) return

    setSubmitting(true)
    setError(null)

    const { error } = await supabase.rpc('update_order_status', {
      p_order_id: orderId,
      p_new_status: 'cancelled',
    })

    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    setStatus('cancelled')
  }

  return (
    <div className="flex items-start justify-between">
      <StatusBadge status={status} />
      {cancellable && (
        <div>
          <button
            onClick={handleCancel}
            disabled={submitting}
            className="rounded border border-red-600 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {submitting ? 'Cancelling...' : 'Cancel order'}
          </button>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  )
}
