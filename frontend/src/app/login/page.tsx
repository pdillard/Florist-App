'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth, roleHome } from '@/lib/auth/AuthContext'
import { Button } from '@/components/shared/Button'

const INPUT_STYLES =
  'w-full rounded-lg border border-gray-300 p-2.5 text-sm transition-all duration-150 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100'

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'customer' | 'merchant' | 'driver'>('customer')
  const [shopName, setShopName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const { user, loading: authLoading } = useAuth()

  // Someone already signed in shouldn't be able to sit on the login page
  // (back button, typed URL, stale tab). Bounce them to their role home
  // before the form ever renders.
  useEffect(() => {
    if (authLoading || !user) return

    let active = true
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (active) router.push(roleHome(data?.role))
      })

    return () => {
      active = false
    }
  }, [authLoading, user, router, supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
            // Only the relevant one of these actually matters per role
            // (see handle_new_user() in sql/012), but there's no harm in
            // always sending both.
            shop_name: shopName,
            invite_code: inviteCode,
          },
        },
      })
      // We already know the chosen role from the form, no need to look it up.
      if (error) {
        // handle_new_user() raises a specific exception for a bad/missing
        // invite code (sql/012), but Supabase's GoTrue sometimes flattens
        // that into a generic "Database error saving new user" instead of
        // passing the real message through. Give driver signups a better
        // default in that case rather than a confusing dead end.
        if (role === 'driver' && /database error/i.test(error.message)) {
          setError('That invite code is missing or invalid. Check it with your shop and try again.')
        } else {
          setError(error.message)
        }
      } else {
        router.push(roleHome(role))
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        // Existing account - role isn't known client-side yet, look it up.
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()
        router.push(roleHome(profile?.role))
      }
    }

    setLoading(false)
  }

  if (authLoading || user) {
    return <main className="flex min-h-[70vh] items-center justify-center p-8 text-gray-500">Redirecting...</main>
  }

  return (
    <main className="relative flex min-h-[85vh] items-center justify-center overflow-hidden p-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-rose-50/60 to-white" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm space-y-4 rounded-2xl border bg-white p-8 shadow-xl shadow-rose-100/60"
      >
        <h1 className="text-2xl font-bold">
          {mode === 'signin' ? 'Welcome back' : 'Create an account'}
        </h1>

        {mode === 'signup' && (
          <input
            className={INPUT_STYLES}
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        <input
          className={INPUT_STYLES}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className={INPUT_STYLES}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        {mode === 'signup' && (
          <select
            className={INPUT_STYLES}
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
          >
            <option value="customer">Customer</option>
            <option value="merchant">Merchant</option>
            <option value="driver">Driver</option>
          </select>
        )}

        {mode === 'signup' && role === 'merchant' && (
          <input
            className={INPUT_STYLES}
            placeholder="Shop name"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            required
          />
        )}

        {mode === 'signup' && role === 'driver' && (
          <div>
            <input
              className={`${INPUT_STYLES} uppercase`}
              placeholder="Shop invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Get this from the shop you&apos;re driving for &mdash; it&apos;s on their Drivers dashboard page.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" variant="accent" loading={loading} className="w-full py-2.5">
          {mode === 'signin' ? 'Sign in' : 'Sign up'}
        </Button>

        <button
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="w-full text-sm text-gray-500 underline decoration-gray-300 underline-offset-2 transition-colors hover:text-black hover:decoration-black"
        >
          {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </button>
      </form>
    </main>
  )
}