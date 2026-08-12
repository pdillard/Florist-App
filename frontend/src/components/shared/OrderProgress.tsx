'use client'

import { motion } from 'framer-motion'
import { CheckCheck, ClipboardCheck, PackageCheck, Truck, UserCheck } from 'lucide-react'

const STEPS = [
  { status: 'pending', label: 'Order received', icon: ClipboardCheck },
  { status: 'confirmed', label: 'Confirmed', icon: PackageCheck },
  { status: 'assigned', label: 'Driver assigned', icon: UserCheck },
  { status: 'out_for_delivery', label: 'Out for delivery', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: CheckCheck },
] as const

const STEP_INDEX: Record<string, number> = Object.fromEntries(
  STEPS.map((s, i) => [s.status, i])
)

// A visual journey instead of a flat status word - this is the "watch it
// happen" feeling without a live map (see the GPS discussion): the line
// between steps actually fills in as the order progresses, in real time,
// same data as before (orders.status via realtime), just given somewhere
// to visibly go.
export function OrderProgress({ status }: { status: string }) {
  if (status === 'cancelled' || status === 'failed') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
        {status === 'cancelled' ? 'This order was cancelled.' : 'This delivery could not be completed.'}
      </div>
    )
  }

  const currentIndex = STEP_INDEX[status] ?? 0

  return (
    <div className="flex items-start">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex
        const isLast = i === STEPS.length - 1

        return (
          <div key={step.status} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{
                  scale: i === currentIndex ? 1.1 : 1,
                  backgroundColor: done ? '#e11d48' : '#e5e7eb',
                  color: done ? '#ffffff' : '#9ca3af',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              >
                <step.icon className="h-4 w-4" />
              </motion.div>
              <span
                className={`hidden max-w-[5.5rem] text-center text-[11px] leading-tight sm:block ${
                  done ? 'font-medium text-gray-900' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>

            {!isLast && (
              <div className="relative -mt-6 h-0.5 flex-1 bg-gray-200 sm:-mt-[42px]">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-rose-600"
                  initial={false}
                  animate={{ width: i < currentIndex ? '100%' : '0%' }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
