import Link from 'next/link'
import type { Metadata } from 'next'

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
    <main className="mx-auto max-w-2xl px-8 py-16 text-center">
      <h1 className="text-3xl font-bold sm:text-4xl">Get in touch</h1>
      <p className="mx-auto mt-3 max-w-md text-gray-600">
        Questions about setting up your shop, pricing, or just want a walkthrough before you sign
        up - reach out directly.
      </p>

      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="mt-8 inline-block rounded bg-black px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 ease-out hover:bg-gray-800 active:scale-[0.97]"
      >
        {CONTACT_EMAIL}
      </a>

      <p className="mt-10 text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="underline hover:text-black">
          Sign in
        </Link>
        .
      </p>
    </main>
  )
}
