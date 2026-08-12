import Link from 'next/link'
import type { Metadata } from 'next'
import { Mail } from 'lucide-react'
import { Reveal } from '@/components/marketing/Reveal'

export const metadata: Metadata = {
  title: 'Contact — Florist Delivery Platform',
  description: 'Get in touch about setting up delivery, tracking, and proof of delivery for your shop.',
}

// Contact info: prestondillard5233@gmail.com for now - update to a
// business address once one exists, this is the only place it's
// hardcoded (also referenced from privacy/terms via this same address).
const CONTACT_EMAIL = 'prestondillard5233@gmail.com'

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-8 py-20 text-center">
      <Reveal>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Get in touch</h1>
        <p className="mx-auto mt-3 max-w-md text-gray-600">
          Questions about setting up your shop, pricing, or just want a walkthrough before you
          sign up - reach out directly.
        </p>

        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-3 text-base font-medium text-white shadow-md shadow-rose-200 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-300/70 hover:brightness-110 active:translate-y-0 active:scale-[0.97]"
        >
          <Mail className="h-4 w-4" />
          {CONTACT_EMAIL}
        </a>

        <p className="mt-10 text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-rose-600 underline hover:text-rose-700">
            Sign in
          </Link>
          .
        </p>
      </Reveal>
    </main>
  )
}
