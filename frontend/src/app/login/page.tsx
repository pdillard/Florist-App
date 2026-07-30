'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth, roleHome } from '@/lib/auth/AuthContext'

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'customer' | 'florist' | 'driver'>('customer')
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
        options: { data: { name, role } },
      })
      // We already know the chosen role from the form, no need to look it up.
      if (error) setError(error.message)
      else router.push(roleHome(role))
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
    return <main className="p-8">Redirecting...</main>
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">
          {mode === 'signin' ? 'Sign in' : 'Create an account'}
        </h1>

        {mode === 'signup' && (
          <input
            className="w-full rounded border p-2"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        <input
          className="w-full rounded border p-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="w-full rounded border p-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        {mode === 'signup' && (
          <select
            className="w-full rounded border p-2"
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
          >
            <option value="customer">Customer</option>
            <option value="florist">Florist</option>
            <option value="driver">Driver</option>
          </select>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black p-2 text-white disabled:opacity-50"
        >
          {loading ? 'Loading...' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="w-full text-sm text-gray-500 underline"
        >
          {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </button>
      </form>
    </main>
  )
}