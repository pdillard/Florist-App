'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Driver = {
  id: string
  name: string | null
}

export function AssignDriverControl({
  orderId,
  drivers,
}: {
  orderId: string
  drivers: Driver[]
}) {
  const [driverId, setDriverId] = useState(drivers[0]?.id ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleAssign() {
    if (!driverId) return
    setSubmitting(true)
    setError(null)

    const { error } = await supabase.rpc('assign_driver', {
      p_order_id: orderId,
      p_driver_id: driverId,
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    // Re-runs the dashboard's server-side data fetch so the new
    // assignment shows up without a full page reload.
    router.refresh()
  }

  if (drivers.length === 0) {
    return <span className="text-sm text-gray-400">No drivers available</span>
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={driverId}
        onChange={(e) => setDriverId(e.target.value)}
        className="rounded border px-2 py-1 text-sm"
      >
        {drivers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name ?? 'Unnamed driver'}
          </option>
        ))}
      </select>
      <button
        onClick={handleAssign}
        disabled={submitting}
        className="rounded bg-black px-2 py-1 text-xs text-white disabled:opacity-50"
      >
        {submitting ? 'Assigning...' : 'Assign'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
