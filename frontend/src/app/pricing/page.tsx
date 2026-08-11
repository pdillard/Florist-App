import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — Florist Delivery Platform',
  description: 'Simple, flat monthly pricing for the delivery add-on florists actually need.',
}

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-3xl px-8 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">Simple pricing</h1>
        <p className="mx-auto mt-3 max-w-lg text-gray-600">
          One flat monthly price. No per-order fees, no separate charge for tracking or proof of
          delivery - that&apos;s the whole point.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-sm rounded-lg border p-8 text-center">
        <p className="text-sm font-medium text-gray-500">Delivery add-on</p>
        <p className="mt-2 text-4xl font-bold">
          $29<span className="text-base font-normal text-gray-500">/month</span>
        </p>
        <p className="mt-1 text-sm text-gray-500">Per shop. First 30 days free.</p>

        <ul className="mt-6 space-y-2 text-left text-sm text-gray-600">
          <li>Unlimited orders and drivers</li>
          <li>Live customer tracking</li>
          <li>Photo and GPS proof of delivery</li>
          <li>Payment links for any order</li>
          <li>Works alongside your existing POS</li>
        </ul>

        <Link
          href="/login"
          className="mt-8 block rounded bg-black px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 ease-out hover:bg-gray-800 active:scale-[0.97]"
        >
          Get started
        </Link>
      </div>

      <div className="mx-auto mt-10 max-w-lg text-center text-sm text-gray-500">
        <p>
          Running more than one shop, or want a walkthrough before signing up?{' '}
          <Link href="/contact" className="underline hover:text-black">
            Contact us
          </Link>{' '}
          and we&apos;ll set it up with you directly.
        </p>
      </div>
    </main>
  )
}
