'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'

// Shared style for every nav link: an underline that grows in from the
// center on hover instead of just a color change - cheap to do, reads as
// noticeably more "designed" than a flat color swap.
const NAV_LINK =
  'relative text-sm text-gray-700 transition-colors hover:text-black after:absolute after:-bottom-1 after:left-1/2 after:h-px after:w-0 after:-translate-x-1/2 after:bg-black after:transition-all after:duration-200 hover:after:w-full'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  const isMerchant = profile?.role === 'merchant'
  const isCustomer = profile?.role === 'customer'
  const isDriver = profile?.role === 'driver'
  const isLoginPage = pathname === '/login'

  // A header that stays flat white until you actually scroll, then gains
  // a soft shadow, feels considered in a way a header that's always
  // styled the same doesn't.
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md transition-shadow duration-200 ${
        scrolled ? 'shadow-sm' : 'shadow-none'
      }`}
    >
      <div className="flex items-center justify-between p-4">
        <Link href="/" className="font-semibold tracking-tight transition-opacity hover:opacity-70">
          Florist Delivery
        </Link>

        <div className="flex items-center gap-6">
          {!user && !isLoginPage && (
            <>
              <Link href="/features" className={NAV_LINK}>
                Features
              </Link>
              <Link href="/pricing" className={NAV_LINK}>
                Pricing
              </Link>
              <Link
                href="/login"
                className="rounded-lg bg-black px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md active:translate-y-0 active:scale-[0.97]"
              >
                Sign in
              </Link>
            </>
          )}
          {isMerchant && pathname !== '/dashboard' && (
            <Link href="/dashboard" className={NAV_LINK}>
              Dashboard
            </Link>
          )}
          {isDriver && pathname !== '/driver' && (
            <Link href="/driver" className={NAV_LINK}>
              My deliveries
            </Link>
          )}
          {isCustomer && pathname !== '/orders' && (
            <Link href="/orders" className={NAV_LINK}>
              My orders
            </Link>
          )}
          {user && (
            <button onClick={handleSignOut} className={NAV_LINK}>
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
