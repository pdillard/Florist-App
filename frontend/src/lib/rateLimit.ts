// Minimal in-memory sliding-window rate limiter. Deliberately not backed by
// Redis/Upstash - this app has exactly one endpoint that needs it so far
// (the public tracking-photo route, see api/track/[orderId]/proof), and a
// per-instance limiter is an honest trade rather than adding a new paid
// dependency for one low-traffic route. The real protection against that
// route being abused is that order ids are random uuids (roughly 2^122
// possibilities) - this is a second, cheap layer on top, not the load-
// bearing one.
//
// Known limitation, stated plainly: on Vercel's serverless runtime this
// map resets on cold start and isn't shared across concurrent instances,
// so it caps abuse per warm instance, not globally. That's still a real
// deterrent against a simple scripted loop (which will mostly hit the same
// warm instance in a tight burst) - just not a guarantee. Revisit with a
// shared store (Upstash Redis, Vercel KV) if this route ever sees traffic
// that makes the gap matter.

const buckets = new Map<string, number[]>()

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const timestamps = buckets.get(key) ?? []
  const recent = timestamps.filter((t) => now - t < windowMs)

  if (recent.length >= limit) {
    buckets.set(key, recent)
    return true
  }

  recent.push(now)
  buckets.set(key, recent)

  // Cheap, occasional cleanup so this map doesn't grow forever across a
  // long-lived warm instance - not on every call, just often enough.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t > windowMs)) buckets.delete(k)
    }
  }

  return false
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}
