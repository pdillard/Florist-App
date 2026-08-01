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
