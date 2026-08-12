'use client'

import { useState } from 'react'
import { Check, Copy, KeyRound, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'

function formatExpiry(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now()
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24))

  if (days <= 0) return { label: 'Expired', urgent: true }
  if (days === 1) return { label: 'Expires in 1 day', urgent: true }
  if (days <= 3) return { label: `Expires in ${days} days`, urgent: true }
  return { label: `Expires in ${days} days`, urgent: false }
}

export function DriverInviteCode({
  inviteCode: initialCode,
  expiresAt: initialExpiresAt,
}: {
  inviteCode: string
  expiresAt: string
}) {
  const [inviteCode, setInviteCode] = useState(initialCode)
  const [expiresAt, setExpiresAt] = useState(initialExpiresAt)
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const expiry = formatExpiry(expiresAt)

  async function copy() {
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function regenerate() {
    if (!confirm('Regenerate this code? Anyone with the old one will no longer be able to sign up as a driver here.')) {
      return
    }

    setRegenerating(true)
    setError(null)

    // regenerate_invite_code() (sql/014) is security definer: it checks
    // is_merchant() and scopes the update to the caller's own shop itself,
    // rather than trusting a merchant_id sent from the client. It returns
    // one row (code, new 14-day expiry), not a bare scalar, hence .single().
    const { data, error } = await supabase.rpc('regenerate_invite_code').single()

    if (error) {
      setError(error.message)
    } else if (data) {
      const row = data as { invite_code: string; invite_code_expires_at: string }
      setInviteCode(row.invite_code)
      setExpiresAt(row.invite_code_expires_at)
    }
    setRegenerating(false)
  }

  return (
    <div className="mb-6 rounded-xl border bg-gray-50 p-4 shadow-sm">
      <p className="flex items-center gap-1.5 text-sm text-gray-600">
        <KeyRound className="h-3.5 w-3.5 shrink-0 text-rose-500" />
        Drivers sign up with this code to join your shop &mdash; share it directly, don&apos;t post it publicly.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code className="rounded-lg border bg-white px-3 py-1.5 font-mono text-lg tracking-wider">
          {inviteCode}
        </code>
        <Button variant="secondary" onClick={copy} type="button">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button variant="ghost" onClick={regenerate} loading={regenerating} type="button">
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate
        </Button>
        <span className={`text-xs ${expiry.urgent ? 'font-medium text-red-600' : 'text-gray-500'}`}>
          {expiry.label}
        </span>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
