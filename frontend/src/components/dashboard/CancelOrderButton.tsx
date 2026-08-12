'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'

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
      <Button variant="danger" onClick={handleCancel} loading={submitting}>
        Cancel order
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
