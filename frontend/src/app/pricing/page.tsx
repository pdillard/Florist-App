import Link from 'next/link'
import type { Metadata } from 'next'
import { Check } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { Reveal } from '@/components/marketing/Reveal'

export const metadata: Metadata = {
  title: 'Pricing — Florist Delivery Platform',
  description: 'Simple, flat monthly pricing for the delivery add-on florists actually need.',
}

const INCLUDED = [
  'Unlimited orders and drivers',
  'Live customer tracking',
  'Photo and GPS proof of delivery',
  'Payment links for any order',
  'Works alongside your existing POS',
]

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-3xl px-8 py-20">
      <Reveal className="text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">Simple pricing</h1>
        <p className="mx-auto mt-3 max-w-lg text-gray-600">
          One flat monthly price. No per-order fees, no separate charge for tracking or proof of
          delivery - that&apos;s the whole point.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="mx-auto mt-14 max-w-sm">
        <div className="relative rounded-2xl border-2 border-rose-200 bg-white p-8 text-center shadow-xl shadow-rose-100">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 px-3 py-1 text-xs font-medium text-white shadow-sm">
            First 30 days free
          </div>

          <p className="mt-2 text-sm font-medium text-gray-500">Delivery add-on</p>
          <p className="mt-2 text-5xl font-bold tracking-tight">
            $29<span className="text-base font-normal text-gray-500">/month</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">Per shop, billed monthly</p>

          <ul className="mt-7 space-y-2.5 text-left text-sm text-gray-700">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                {item}
              </li>
            ))}
          </ul>

          <Button href="/login" variant="accent" className="mt-8 w-full py-3 text-base">
            Get started
          </Button>
        </div>
      </Reveal>

      <Reveal delay={0.2} className="mx-auto mt-10 max-w-lg text-center text-sm text-gray-500">
        <p>
          Running more than one shop, or want a walkthrough before signing up?{' '}
          <Link href="/contact" className="text-rose-600 underline hover:text-rose-700">
            Contact us
          </Link>{' '}
          and we&apos;ll set it up with you directly.
        </p>
      </Reveal>
    </main>
  )
}
