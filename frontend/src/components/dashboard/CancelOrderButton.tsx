'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

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

    router.refresh()
  }

  return (
    <div>
      <button
        onClick={handleCancel}
        disabled={submitting}
        className="rounded border border-red-600 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Cancel order
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
