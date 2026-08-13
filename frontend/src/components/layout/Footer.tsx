import Link from 'next/link'
import { Flower2 } from 'lucide-react'

// Global, on every page including the app screens - the same pattern
// plenty of B2B SaaS dashboards use (Stripe's own dashboard keeps a
// terms/privacy footer). Legal links need to be reachable from anywhere,
// not just the marketing pages.
const COLUMNS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: 'Product',
    links: [
      { href: '/features', label: 'Features' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/login', label: 'Sign in' },
    ],
  },
  {
    heading: 'Company',
    links: [{ href: '/contact', label: 'Contact' }],
  },
  {
    heading: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t bg-gray-50 px-8 pb-8 pt-12">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-rose-600 to-pink-600 text-white">
                <Flower2 className="h-3.5 w-3.5" />
              </span>
              <span className="font-semibold tracking-tight">Florist Delivery</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-gray-500">
              The delivery layer local florists add to what they already use &mdash; photo and
              GPS proof on every order, without replacing your storefront or POS.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {col.heading}
              </p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 transition-colors hover:text-black hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-gray-400 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Florist Delivery Platform</p>
          <p>Built for local florists, one shop at a time.</p>
        </div>
      </div>
    </footer>
  )
}
