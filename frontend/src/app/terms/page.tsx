import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Florist Delivery Platform',
}

const LAST_UPDATED = 'August 10, 2026'
const CONTACT_EMAIL = 'prestondillard5233@gmail.com'

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-8 py-16">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="mt-1 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>

      <div className="mt-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
        This is a general-purpose template, not legal advice, and hasn&apos;t been reviewed by a
        lawyer. Have it reviewed before relying on it with paying customers - governing law,
        liability limits, and driver-relationship language in particular should be confirmed once
        the business is formally registered.
      </div>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="font-semibold text-gray-900">1. Acceptance of terms</h2>
          <p className="mt-2">
            By creating an account or using this service, you agree to these terms. If you&apos;re
            using it on behalf of a shop, you&apos;re agreeing on that shop&apos;s behalf and
            confirming you&apos;re authorized to do so.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900">2. What this service is</h2>
          <p className="mt-2">
            This is delivery dispatch, live tracking, and proof-of-delivery software for local
            merchants. It is not a storefront, point-of-sale system, or payment processor in
            itself - it works alongside whatever a merchant already uses for those. It does not
            provide wire-service order routing.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900">3. Accounts and roles</h2>
          <p className="mt-2">
            There are three account types: merchant (creates and manages a shop), driver (joins a
            shop using that shop&apos;s invite code), and customer (tracks deliveries). You&apos;re
            responsible for keeping your login credentials secure and for activity on your
            account. A merchant is responsible for the accuracy of the orders it enters and for
            who it invites as drivers.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900">4. Acceptable use</h2>
          <p className="mt-2">
            Don&apos;t use the service to submit false delivery information, access another
            shop&apos;s data without authorization, interfere with the service&apos;s operation,
            or use it for anything unlawful.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900">5. Orders and payments</h2>
          <p className="mt-2">
            A merchant is responsible for the orders it creates, including pricing and fulfillment.
            Where payment is collected through the service, it&apos;s processed by Stripe under
            Stripe&apos;s own terms; refunds and payment disputes for a given order are the
            responsibility of the merchant who took that order, not this platform.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900">6. Drivers</h2>
          <p className="mt-2">
            Drivers are added to a shop&apos;s account by that shop using its invite code. The
            relationship between a shop and its drivers - including how they&apos;re engaged, paid,
            and classified - is between the shop and the driver; this service doesn&apos;t define
            or control that relationship.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900">7. Proof of delivery and disputes</h2>
          <p className="mt-2">
            Delivery photos, timestamps, and GPS coordinates are captured to help resolve
            delivery disputes, but their availability or content isn&apos;t a guarantee of any
            particular outcome in a dispute with a customer, a card issuer, or anyone else.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900">8. Disclaimers</h2>
          <p className="mt-2">
            The service is provided &ldquo;as is,&rdquo; without warranties of any kind, express
            or implied. We don&apos;t guarantee it will be uninterrupted, error-free, or fit for
            any particular purpose.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900">9. Limitation of liability</h2>
          <p className="mt-2">
            To the maximum extent permitted by law, we aren&apos;t liable for indirect,
            incidental, or consequential damages arising from use of the service, including lost
            orders, lost revenue, or delivery disputes between a merchant and its customers.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900">10. Termination</h2>
          <p className="mt-2">
            You can stop using the service and close your account at any time. We may suspend or
            terminate access for a violation of these terms, including unauthorized access to
            another shop&apos;s data.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900">11. Governing law</h2>
          <p className="mt-2">
            [To be finalized once the business is formally registered - governing law and venue
            will be specified here.]
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900">12. Changes to these terms</h2>
          <p className="mt-2">
            If these terms change materially, we&apos;ll update the date above and, where
            appropriate, let account holders know directly.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900">13. Contact</h2>
          <p className="mt-2">
            Questions about these terms:{' '}
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
