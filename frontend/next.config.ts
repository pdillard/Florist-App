import type { NextConfig } from 'next'

// Baseline security headers - none of this existed before (there was no
// next.config file at all), so the app was shipping with zero hardening
// beyond whatever Vercel adds by default. Kept deliberately conservative:
// no Content-Security-Policy here, because a wrong CSP fails silently
// (blocks scripts/styles with no visible error to whoever's testing) and
// this couldn't be verified against a real production build in the
// environment this was written in (see the deploy history - `next build`
// itself crashes in that sandbox with an unrelated native-binary issue).
// Worth adding once someone can click through the deployed site and watch
// the browser console for violations.
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Stops this site from ever being framed by another origin -
          // the standalone fix for clickjacking, doesn't depend on CSP
          // support and has zero chance of breaking anything since this
          // app never embeds itself in an iframe.
          { key: 'X-Frame-Options', value: 'DENY' },
          // Stops browsers from MIME-sniffing a response into executing
          // as something other than what its Content-Type says.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Sends the full URL as a referrer only to same-origin
          // requests; cross-origin gets just the origin, not the full
          // path (order ids, tracking links) that a Referer header would
          // otherwise leak to e.g. an embedded analytics or font script
          // on the next page a visitor clicks through to.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Denies browser APIs this app has no legitimate use for.
          // geolocation stays available to self - the driver app captures
          // it on delivery confirmation (sql/016_delivery_proof_geolocation.sql).
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), payment=(), usb=(), geolocation=(self)',
          },
        ],
      },
    ]
  },
}

export default nextConfig
