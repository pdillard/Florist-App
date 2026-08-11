import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Features — Florist Delivery Platform',
  description: 'Order entry, driver dispatch, live tracking, and photo/GPS proof of delivery for local florists.',
}

const FEATURES = [
  {
    title: 'Order entry, no matter how it comes in',
    body: 'Enter phone and walk-in orders directly from the dashboard. This sits next to your existing storefront or POS - it doesn’t ask you to move your ordering process anywhere.',
  },
  {
    title: 'Driver dispatch, scoped to your shop',
    body: 'Assign any of your shop’s drivers to an order in one click. Drivers join with an invite code you control and can regenerate any time - nobody joins your roster without it.',
  },
  {
    title: 'Photo and GPS proof of delivery',
    body: 'Every delivery is closed out with a timestamped photo and location, captured by the driver at the door. It’s built into the delivery flow, not something you have to remember to ask for.',
  },
  {
    title: 'Live customer tracking',
    body: 'Every order gets a tracking link that updates in real time as its status changes - no app download, nothing for the customer to remember to check.',
  },
  {
    title: 'Dispute-ready evidence',
    body: 'When a customer calls saying an order never arrived, pull up the timestamp, GPS point, and photo instead of relying on memory or your word against theirs.',
  },
  {
    title: 'Payment links',
    body: 'Generate a secure payment link for any order and send it however you’d send anything else - text, email. No card numbers touch your systems.',
  },
  {
    title: 'Isolated by shop',
    body: 'Every shop’s orders, drivers, and customer data are walled off from every other shop at the database level, not just hidden in the interface.',
  },
  {
    title: 'Works with what you already use',
    body: 'This isn’t a replacement for your storefront, POS, or wire-service relationships - it’s the delivery and proof-of-delivery layer that runs alongside them.',
  },
]

export default function FeaturesPage() {
  return (
    <main className="mx-auto max-w-4xl px-8 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">Everything you need to run deliveries</h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-600">
          Nothing you don&apos;t. This handles getting an order out the door and proving it
          arrived - it doesn&apos;t try to replace the storefront or POS you already run.
        </p>
      </div>

      <div className="mt-12 grid gap-8 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-lg border p-5">
            <h2 className="font-semibold">{feature.title}</h2>
            <p className="mt-1.5 text-sm text-gray-600">{feature.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 text-center">
        <Link
          href="/login"
          className="rounded bg-black px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 ease-out hover:bg-gray-800 active:scale-[0.97]"
        >
          Get started
        </Link>
      </div>
    </main>
  )
}
