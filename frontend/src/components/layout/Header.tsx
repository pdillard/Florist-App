'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { CartCount } from '@/components/cart/CartCount'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

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
