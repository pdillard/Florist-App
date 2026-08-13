'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Flower2, Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '@/lib/auth/AuthContext'

// Shared style for every nav link: an underline that grows in from the
// center on hover instead of just a color change - cheap to do, reads as
// noticeably more "designed" than a flat color swap.
const NAV_LINK =
  'relative text-sm text-gray-700 transition-colors hover:text-black after:absolute after:-bottom-1 after:left-1/2 after:h-px after:w-0 after:-translate-x-1/2 after:bg-black after:transition-all after:duration-200 hover:after:w-full'

function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-600 to-pink-600 text-white shadow-sm shadow-rose-200 transition-transform duration-200 group-hover:scale-105">
        <Flower2 className="h-4 w-4" />
      </span>
      <span className="font-semibold tracking-tight transition-opacity group-hover:opacity-70">
        Florist Delivery
      </span>
    </Link>
  )
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

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

  // Close the mobile menu on route change so it never lingers open after
  // a link is tapped.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  const navItems: { href: string; label: string }[] = []
  if (!user && !isLoginPage) {
    navItems.push({ href: '/features', label: 'Features' }, { href: '/pricing', label: 'Pricing' })
  }
  if (isMerchant && pathname !== '/dashboard') navItems.push({ href: '/dashboard', label: 'Dashboard' })
  if (isDriver && pathname !== '/driver') navItems.push({ href: '/driver', label: 'My deliveries' })
  if (isCustomer && pathname !== '/orders') navItems.push({ href: '/orders', label: 'My orders' })

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md transition-shadow duration-200 ${
        scrolled ? 'shadow-sm' : 'shadow-none'
      }`}
    >
      <div className="flex items-center justify-between p-4">
        <Logo />

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 sm:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={NAV_LINK}>
              {item.label}
            </Link>
          ))}
          {!user && !isLoginPage && (
            <Link
              href="/login"
              className="rounded-lg bg-black px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-md active:translate-y-0 active:scale-[0.97]"
            >
              Sign in
            </Link>
          )}
          {user && (
            <button onClick={handleSignOut} className={NAV_LINK}>
              Sign out
            </button>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 sm:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden border-t bg-white sm:hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-black"
                >
                  {item.label}
                </Link>
              ))}
              {!user && !isLoginPage && (
                <Link
                  href="/login"
                  className="mt-1 rounded-lg bg-black px-3 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                  Sign in
                </Link>
              )}
              {user && (
                <button
                  onClick={handleSignOut}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-black"
                >
                  Sign out
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
