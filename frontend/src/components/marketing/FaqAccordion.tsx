'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'Do I have to replace my POS or storefront?',
    a: 'No. This isn’t a storefront or a checkout system — it’s the delivery layer that sits next to whatever you already use to take orders. Keep your existing setup exactly as it is.',
  },
  {
    q: 'What if my driver’s phone doesn’t have signal or the GPS permission gets denied?',
    a: 'Delivery confirmation only ever requires a photo — that’s never optional. GPS is captured opportunistically alongside it when the device allows; if it can’t, the photo and server timestamp still stand as proof on their own.',
  },
  {
    q: 'Is there a contract, or can I cancel anytime?',
    a: 'No contract. Try it free for the first 30 days, and if it’s not for you, stop — nothing to cancel or unwind.',
  },
  {
    q: 'How long does setup actually take?',
    a: 'Most shops are entering their first order within minutes: sign up, add your products (or import them from a spreadsheet), invite your drivers, and you’re running.',
  },
  {
    q: 'Can my customers see the order without creating an account?',
    a: 'Yes. Every order gets a tracking link that works with no login — you send it, they open it, and it updates live as the status changes.',
  },
]

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="mx-auto max-w-2xl divide-y divide-gray-200 rounded-2xl border bg-white">
      {FAQS.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50"
            >
              <span className="text-sm font-medium text-gray-900">{item.q}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-4 text-sm text-gray-600">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
