'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type Role = 'customer' | 'merchant' | 'driver'

type AuthContextValue = {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return
      setUser(data.user)
      setLoading(false)
    })

    // Keeps `user` in sync everywhere that reads it (header, cart, checkout)
    // whenever sign-in/sign-out happens, without each of them subscribing
    // to Supabase auth separately.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return ctx
}

// Where a signed-in user should land right after auth, based on role.
export function roleHome(role: Role | null | undefined) {
  switch (role) {
    case 'merchant':
      return '/dashboard'
    // (driver)/driver/page.tsx is still an empty stub (not built yet, see
    // roadmap item 3) - routing there would error. Send drivers home until
    // that page exists, then switch this back to '/driver'.
    case 'driver':
      return '/'
    case 'customer':
    default:
      return '/shop'
  }
}
