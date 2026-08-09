'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'

export function DriverInviteCode({ inviteCode: initialCode }: { inviteCode: string }) {
  const [inviteCode, setInviteCode] = useState(initialCode)
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

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

    // regenerate_invite_code() (sql/012) is security definer: it checks
    // is_merchant() and scopes the update to the caller's own shop itself,
    // rather than trusting a merchant_id sent from the client.
    const { data, error } = await supabase.rpc('regenerate_invite_code')

    if (error) {
      setError(error.message)
    } else {
      setInviteCode(data as string)
    }
    setRegenerating(false)
  }

  return (
    <div className="mb-6 rounded border bg-gray-50 p-4">
      <p className="text-sm text-gray-600">
        Drivers sign up with this code to join your shop &mdash; share it directly, don&apos;t post it publicly.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <code className="rounded border bg-white px-3 py-1.5 font-mono text-lg tracking-wider">
          {inviteCode}
        </code>
        <Button variant="secondary" onClick={copy} type="button">
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button variant="ghost" onClick={regenerate} loading={regenerating} type="button">
          Regenerate
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
