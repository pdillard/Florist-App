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
  const isLoginPage = pathname === '/login'

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
        {!user && !isLoginPage && (
          <>
            <Link href="/features" className="text-sm text-gray-700 transition-colors hover:text-black">
              Features
            </Link>
            <Link href="/pricing" className="text-sm text-gray-700 transition-colors hover:text-black">
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm text-gray-700 underline transition-colors hover:text-black"
            >
              Sign in
            </Link>
          </>
        )}
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
