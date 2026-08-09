'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function DriverAvailabilityToggle({
  userId,
  isAvailable: initialIsAvailable,
}: {
  userId: string
  isAvailable: boolean
}) {
  const [isAvailable, setIsAvailable] = useState(initialIsAvailable)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  async function toggle() {
    const next = !isAvailable
    setSubmitting(true)

    // Plain client-side update, not an RPC: RLS on driver_profiles already
    // restricts this to a merchant managing their own shop's drivers
    // (fixed in sql/006_rls_tenant_scoping.sql). We already know the new
    // value, so flip local state on success instead of re-fetching the
    // whole page just to read back the value we just wrote.
    const { error } = await supabase
      .from('driver_profiles')
      .update({ is_available: next })
      .eq('user_id', userId)

    setSubmitting(false)
    if (!error) {
      setIsAvailable(next)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={submitting}
      className={`rounded px-2 py-1 text-xs transition-all duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${
        isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {isAvailable ? 'Available' : 'Unavailable'}
    </button>
  )
}
