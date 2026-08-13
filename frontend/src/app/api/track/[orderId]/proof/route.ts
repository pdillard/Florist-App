import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// Backs the public tracking page's proof-of-delivery photo. Deliberately a
// separate route from a plain client-side storage.createSignedUrl() call,
// because that call would run as whatever the visitor's session is (often
// none - this page is meant to work with no login), and storage.objects
// has no anon read policy (sql/009) - nor should it, the same reasoning as
// not putting an anon policy directly on the orders table (see
// sql/017_public_tracking.sql).
//
// Two-step, least-privilege by construction:
//   1. Ask get_delivery_proof_for_tracking(orderId) - a SECURITY DEFINER
//      function that only returns a row once the order is actually
//      'delivered' - for the real storage path. This runs as the anon/
//      authenticated caller; there is nothing here a visitor with just an
//      order id could trick into returning someone else's path, since the
//      function's own WHERE clause is what decides what's real.
//   2. Only ever sign the path THAT CALL returned - never a path taken
//      from the request (query param, body, anything client-supplied).
//      That's what keeps this from being a path-traversal / IDOR into
//      other shops' delivery photos despite using the service role to
//      mint the URL.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params

  const supabase = await createClient()
  const { data: rawProof, error } = await supabase
    .rpc('get_delivery_proof_for_tracking', { p_order_id: orderId })
    .maybeSingle()

  if (error || !rawProof) {
    return NextResponse.json({ error: 'no proof available' }, { status: 404 })
  }

  const proof = rawProof as {
    photo_path: string | null
    lat: number | null
    lng: number | null
    location_accuracy_m: number | null
  }

  if (!proof.photo_path) {
    return NextResponse.json({ error: 'no proof available' }, { status: 404 })
  }

  let service
  try {
    service = createServiceClient()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'storage not configured'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const { data: signed, error: signError } = await service.storage
    .from('delivery-proofs')
    .createSignedUrl(proof.photo_path, 60 * 60)

  if (signError || !signed) {
    return NextResponse.json({ error: 'could not sign photo url' }, { status: 500 })
  }

  return NextResponse.json({
    url: signed.signedUrl,
    lat: proof.lat,
    lng: proof.lng,
    accuracy: proof.location_accuracy_m,
  })
}
