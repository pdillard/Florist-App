'use client'

import { useState } from 'react'
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
  // Once assigned, we already know the driver's name from the `drivers`
  // list we were given, no need to ask the server to tell us back what we
  // just told it.
  const [assignedName, setAssignedName] = useState<string | null>(null)
  const supabase = createClient()

  async function handleAssign() {
    if (!driverId) return
    setSubmitting(true)
    setError(null)

    const { error } = await supabase.rpc('assign_driver', {
      p_order_id: orderId,
      p_driver_id: driverId,
    })

    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    const picked = drivers.find((d) => d.id === driverId)
    setAssignedName(picked?.name ?? 'Unnamed driver')
  }

  if (assignedName) {
    return <span className="text-sm">{assignedName}</span>
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
