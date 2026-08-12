'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'
import { INPUT_STYLES } from '@/lib/ui'

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
        className={`${INPUT_STYLES} py-1.5 text-xs`}
      >
        {drivers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name ?? 'Unnamed driver'}
          </option>
        ))}
      </select>
      <Button onClick={handleAssign} loading={submitting} className="px-2.5 py-1 text-xs">
        Assign
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
