import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Service-role client: bypasses RLS entirely, authenticates as the
// Postgres `service_role`. Only ever use this where there is no user
// session to check against - right now that's exactly one place, the
// Stripe webhook handler, which is authenticated by Stripe's signature on
// the request instead of a Supabase session. Do not reuse this for
// anything a logged-in user's session could do instead; use
// lib/supabase/server.ts (cookie-based, respects RLS) for that.
export function createServiceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Add it to frontend/.env.local (see .env.local.example).'
    )
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
