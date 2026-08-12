import type { Metadata } from 'next'
import {
  Camera,
  ClipboardList,
  KeyRound,
  Link2,
  MapPin,
  ScanEye,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { Reveal } from '@/components/marketing/Reveal'

export const metadata: Metadata = {
  title: 'Features — Florist Delivery Platform',
  description: 'Order entry, driver dispatch, live tracking, and photo/GPS proof of delivery for local florists.',
}

const FEATURES = [
  {
    icon: ClipboardList,
    title: 'Order entry, no matter how it comes in',
    body: 'Enter phone and walk-in orders directly from the dashboard. This sits next to your existing storefront or POS - it doesn’t ask you to move your ordering process anywhere.',
  },
  {
    icon: KeyRound,
    title: 'Driver dispatch, scoped to your shop',
    body: 'Assign any of your shop’s drivers to an order in one click. Drivers join with an invite code you control and can regenerate any time - nobody joins your roster without it.',
  },
  {
    icon: Camera,
    title: 'Photo and GPS proof of delivery',
    body: 'Every delivery is closed out with a timestamped photo and location, captured by the driver at the door. It’s built into the delivery flow, not something you have to remember to ask for.',
  },
  {
    icon: MapPin,
    title: 'Live customer tracking',
    body: 'Every order gets a tracking link that updates in real time as its status changes - no app download, nothing for the customer to remember to check.',
  },
  {
    icon: ScanEye,
    title: 'Dispute-ready evidence',
    body: 'When a customer calls saying an order never arrived, pull up the timestamp, GPS point, and photo instead of relying on memory or your word against theirs.',
  },
  {
    icon: Wallet,
    title: 'Payment links',
    body: 'Generate a secure payment link for any order and send it however you’d send anything else - text, email. No card numbers touch your systems.',
  },
  {
    icon: ShieldCheck,
    title: 'Isolated by shop',
    body: 'Every shop’s orders, drivers, and customer data are walled off from every other shop at the database level, not just hidden in the interface.',
  },
  {
    icon: Link2,
    title: 'Works with what you already use',
    body: 'This isn’t a replacement for your storefront, POS, or wire-service relationships - it’s the delivery and proof-of-delivery layer that runs alongside them.',
  },
]

export default function FeaturesPage() {
  return (
    <main className="mx-auto max-w-5xl px-8 py-20">
      <Reveal className="text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">Everything you need to run deliveries</h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-600">
          Nothing you don&apos;t. This handles getting an order out the door and proving it
          arrived - it doesn&apos;t try to replace the storefront or POS you already run.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {FEATURES.map((feature, i) => (
          <Reveal key={feature.title} delay={(i % 2) * 0.08}>
            <div className="group h-full rounded-2xl border bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-colors duration-200 group-hover:bg-rose-600 group-hover:text-white">
                <feature.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-3 font-semibold">{feature.title}</h2>
              <p className="mt-1.5 text-sm text-gray-600">{feature.body}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-16 text-center">
        <Button href="/login" variant="accent" className="px-6 py-3 text-base">
          Get started
        </Button>
      </Reveal>
    </main>
  )
}
