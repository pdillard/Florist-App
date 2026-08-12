'use client'

import { motion } from 'framer-motion'

// Soft, slowly-drifting color blurs behind the hero - the "premium SaaS
// landing page" background technique (Linear, Vercel, Stripe all use a
// version of it). Purely decorative: absolutely positioned, blurred,
// low-opacity, and pointer-events-none so it never interferes with the
// real content stacked on top of it.
export function GradientBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-rose-300/40 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-pink-300/30 blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-1/3 top-40 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl"
        animate={{ x: [0, 25, 0], y: [0, -15, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}
