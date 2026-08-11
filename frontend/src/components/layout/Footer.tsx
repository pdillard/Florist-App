import Link from 'next/link'

// Global, on every page including the app screens - the same pattern
// plenty of B2B SaaS dashboards use (Stripe's own dashboard keeps a
// terms/privacy footer). Legal links need to be reachable from anywhere,
// not just the marketing pages.
const LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
]

export function Footer() {
  return (
    <footer className="border-t px-8 py-6">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 text-xs text-gray-500 sm:flex-row sm:justify-between">
        <p>&copy; {new Date().getFullYear()} Florist Delivery Platform</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-black hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
