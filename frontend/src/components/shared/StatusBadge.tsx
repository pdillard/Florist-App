'use client'

import { motion, AnimatePresence } from 'framer-motion'

export const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  assigned: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
}

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  assigned: 'Assigned',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'
  const label = STATUS_LABELS[status] ?? status

  return (
    // AnimatePresence + a key on the status gives a little pop every time
    // the value actually changes (including live, via realtime), instead
    // of the badge just silently swapping text - the same instant with no
    // "something just happened" cue that was true of the whole app before.
    <AnimatePresence mode="wait">
      <motion.span
        key={status}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${style}`}
      >
        {label}
      </motion.span>
    </AnimatePresence>
  )
}
