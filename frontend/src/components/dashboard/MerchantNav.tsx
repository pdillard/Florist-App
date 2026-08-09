'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/dashboard', label: 'Orders' },
  { href: '/dashboard/new-order', label: 'New order' },
  { href: '/dashboard/drivers', label: 'Drivers' },
  { href: '/dashboard/inventory', label: 'Inventory' },
]

export function MerchantNav() {
  const pathname = usePathname()

  return (
    <nav className="mb-6 flex gap-1 border-b">
      {LINKS.map((link) => {
        // Exact match for /dashboard so it doesn't stay highlighted on
        // every sub-page, prefix match for the rest.
        const isActive =
          link.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(link.href)

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`border-b-2 px-3 py-2 text-sm ${
              isActive
                ? 'border-black font-medium text-black'
                : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
