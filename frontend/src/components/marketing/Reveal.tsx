'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'

// Fades + slides content up as it scrolls into view, once - used to give
// the marketing pages (landing/features/pricing) some life without
// touching the actual app screens, which stay plain and functional on
// purpose. `delay` lets a row of cards stagger instead of all popping in
// at the same instant.
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
