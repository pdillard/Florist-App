'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut } = useAuth()

  const isMerchant = profile?.role === 'merchant'
  const isCustomer = profile?.role === 'customer'
  const isDriver = profile?.role === 'driver'

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  return (
    <header className="flex items-center justify-between border-b p-4">
      <Link href="/" className="font-semibold">
        Florist Delivery
      </Link>

      <div className="flex items-center gap-4">
        {isMerchant && pathname !== '/dashboard' && (
          <Link href="/dashboard" className="text-sm text-gray-700 underline transition-colors hover:text-black">
            Dashboard
          </Link>
        )}
        {isDriver && pathname !== '/driver' && (
          <Link href="/driver" className="text-sm text-gray-700 underline transition-colors hover:text-black">
            My deliveries
          </Link>
        )}
        {isCustomer && pathname !== '/orders' && (
          <Link href="/orders" className="text-sm text-gray-700 underline transition-colors hover:text-black">
            My orders
          </Link>
        )}
        {user && (
          <button onClick={handleSignOut} className="text-sm text-gray-700 underline transition-colors hover:text-black">
            Sign out
          </button>
        )}
      </div>
    </header>
  )
}
