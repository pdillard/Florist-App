import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
}

const LAST_UPDATED = 'August 10, 2026'
const CONTACT_EMAIL = 'prestondillard5233@gmail.com'

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-8 py-16">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-1 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>

      <div className="mt-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
        This is a general-purpose template, not legal advice, and hasn&apos;t been reviewed by a
        lawyer. Before relying on it with real customer data - especially delivery photos, GPS
        location, and payment information - have it reviewed by an attorney, particularly for SMS
        (TCPA) and payment (PCI) compliance once those are live.
      </div>

      <div className="prose-sm mt-8 space-y-6 text-sm leading-relaxed text-gray-700">
        <p>
          Florist Delivery Platform (&ldquo;we,&rdquo; &ldquo;us&rdquo;) provides delivery
          dispatch, tracking, and proof-of-delivery software to local shops (&ldquo;merchants&rdquo;)
          and their drivers and customers. This policy explains what we collect, why, and how to
          reach us about it.
        </p>

        <section>
          <h2 className="font-semibold text-gray-900">Information we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium">Account information:</span> name, email, phone, and
              role (customer, merchant, or driver) when you sign up.
            </li>
            <li>
              <span className="font-medium">Order and delivery information:</span> recipient
              name and phone, delivery address, card messages, and order status history.
            </li>
            <li>
              <span className="font-medium">Delivery proof:</span> a timestamped photo and GPS
              location captured by a driver when marking an order delivered.
            </li>
            <li>
              <span className="font-medium">Payment information:</span> handled directly by
              Stripe. We do not receive or store full card numbers - we retain only order-level
              payment status and Stripe&apos;s reference identifiers.
            </li>
            <li>
              <span className="font-medium">Communications:</span> if you email us, we keep that
              correspondence to respond and for our records.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900">How we use it</h2>
          <p className="mt-2">
            To operate the service: creating and dispatching orders, generating tracking links,
            recording proof of delivery, processing payments, and providing support. We do not
            sell personal information, and we do not use delivery or order data for advertising.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900">Who we share it with</h2>
          <p className="mt-2">
            We use a small number of service providers to run the platform, each of whom
            processes data only to provide their service to us:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium">Supabase</span> - database, authentication, and file
              storage (delivery photos).
            </li>
            <li>
              <span className="font-medium">Stripe</span> - payment processing.
            </li>
            <li>
              <span className="font-medium">Twilio</span> - SMS notifications, once enabled.
            </li>
            <li>
              <span className="font-medium">Vercel</span> - application hosting.
            </li>
          </ul>
          <p className="mt-2">
            A merchant using this platform can see the order, delivery, and customer information
            tied to their own shop - not any other shop&apos;s. We don&apos;t share your
            information with unrelated third parties, and we&apos;ll disclose it beyond the above
            only if required by law or to protect the safety or rights of our users.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900">Data retention</h2>
          <p className="mt-2">
            We keep order, delivery, and account data for as long as the associated account is
            active, plus a reasonable period after for recordkeeping and dispute resolution
            (delivery proof in particular exists to be available if a delivery is disputed after
            the fact). You can request deletion as described below.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900">Your choices</h2>
          <p className="mt-2">
            You can request a copy of the personal information we hold about you, ask us to
            correct it, or ask us to delete your account and associated data, by emailing{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-black">
              {CONTACT_EMAIL}
            </a>
            . We may need to keep some order records where a merchant has a legitimate business
            or legal reason to retain them (e.g. a completed transaction).
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900">Cookies</h2>
          <p className="mt-2">
            We use only the cookies necessary to keep you signed in (via Supabase Auth). We don&apos;t
            use third-party advertising or tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900">Children&apos;s privacy</h2>
          <p className="mt-2">
            This service is intended for business use by adults (shop staff, drivers, and
            customers placing orders) and isn&apos;t directed at children.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900">Security</h2>
          <p className="mt-2">
            Data is stored with Supabase and access is restricted by database-level authorization
            rules, so a shop can only read its own orders, drivers, and related customer data. No
            method of storage or transmission is perfectly secure, but we take reasonable steps
            to protect what we hold.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900">Changes to this policy</h2>
          <p className="mt-2">
            If this policy changes materially, we&apos;ll update the date above and, where
            appropriate, let account holders know directly.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900">Contact</h2>
          <p className="mt-2">
            Questions about this policy or your data:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-black">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  )
}
