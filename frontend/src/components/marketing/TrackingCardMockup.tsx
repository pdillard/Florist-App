'use client'

import { motion } from 'framer-motion'
import { Camera, CheckCircle2, MapPin, Truck } from 'lucide-react'

// A built-from-scratch UI mockup, not a real screenshot or real customer
// data - deliberately generic ("Order #1042") rather than implying any
// actual shop or delivery. Gives the hero something concrete to look at
// instead of just text, without fabricating social proof.
export function TrackingCardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* Faint card stacked behind the main one - suggests depth/a stack of
          orders without adding real content that could look like fabricated
          data. */}
      <div
        aria-hidden
        className="absolute inset-x-4 -bottom-3 h-full rounded-2xl border border-gray-200 bg-white/70"
      />

      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
        whileHover={{ rotate: 0, y: -4 }}
        className="relative rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl shadow-rose-100"
      >
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <p className="text-xs font-medium text-gray-400">Order #1042</p>
            <p className="text-sm font-semibold">Delivering to Maple St.</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
            Out for delivery
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>Order confirmed</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>Driver assigned &mdash; Maria</span>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-gray-900">
            <motion.span
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="flex h-4 w-4 shrink-0 items-center justify-center"
            >
              <Truck className="h-4 w-4 text-rose-500" />
            </motion.span>
            <span>On the way &mdash; 8 min out</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <Camera className="h-4 w-4 shrink-0" />
            <span>Photo proof on arrival</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-rose-500" />
          Live tracking updates automatically, no refresh needed
        </div>
      </motion.div>

      {/* Floating GPS badge, offset off the top-right corner of the card -
          a small "orbiting" detail, the kind of touch that makes a hero
          mockup feel designed rather than just a screenshot. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9, ease: 'easeOut' }}
        className="absolute -right-4 -top-4 flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-lg"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        GPS confirmed
      </motion.div>
    </div>
  )
}
