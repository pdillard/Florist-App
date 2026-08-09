'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { CartCount } from '@/components/cart/CartCount'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut } = useAuth()

  const isLoginPage = pathname === '/login'
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
          <Link href="/dashboard" className="text-sm underline">
            Dashboard
          </Link>
        )}
        {isDriver && pathname !== '/driver' && (
          <Link href="/driver" className="text-sm underline">
            My deliveries
          </Link>
        )}
        {isCustomer && pathname !== '/orders' && (
          <Link href="/orders" className="text-sm underline">
            My orders
          </Link>
        )}
        {!isLoginPage && <CartCount />}
        {user && (
          <button onClick={handleSignOut} className="text-sm underline">
            Sign out
          </button>
        )}
      </div>
    </header>
  )
}
