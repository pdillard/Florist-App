'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type Role = 'customer' | 'merchant' | 'driver'

type Profile = {
  role: Role
  merchant_id: string | null
  name: string | null
}

type AuthContextValue = {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    async function loadProfile(userId: string) {
      const { data } = await supabase
        .from('profiles')
        .select('role, merchant_id, name')
        .eq('id', userId)
        .single()
      if (active) setProfile(data ?? null)
    }

    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return
      setUser(data.user)
      if (data.user) {
        await loadProfile(data.user.id)
      }
      setLoading(false)
    })

    // Keeps `user`/`profile` in sync everywhere that reads them (header,
    // dashboard, driver app) whenever sign-in/sign-out happens, without
    // each of them subscribing to Supabase auth separately.
    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
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
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
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
// There's no customer-facing storefront in this app (positioning is an
// add-on that sits next to a shop's existing POS/storefront, not a
// replacement for one - see README), so a customer account's home is its
// order history, which they'd only reach via a tracking link a shop sent
// them in the first place.
export function roleHome(role: Role | null | undefined) {
  switch (role) {
    case 'merchant':
      return '/dashboard'
    case 'driver':
      return '/driver'
    case 'customer':
    default:
      return '/orders'
  }
}
