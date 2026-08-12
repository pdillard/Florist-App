import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Powers the preview card when a link to this site is shared in a text,
// email, or Slack message - without this, sharing the site link (exactly
// what the outreach email templates ask a shop to do) shows a blank or
// generic preview instead of something that looks like a real product.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: 'linear-gradient(135deg, #fff1f2 0%, #ffffff 60%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 20,
            fontWeight: 600,
            color: '#be123c',
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: 999,
            padding: '8px 20px',
            width: 'fit-content',
            marginBottom: 32,
          }}
        >
          Built for local florists
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: -1,
            color: '#171717',
            maxWidth: 950,
          }}
        >
          Stop the &ldquo;where are my flowers?&rdquo; calls.
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: '#4b5563', marginTop: 28, maxWidth: 850 }}>
          Live tracking and photo proof of delivery, built for florists.
        </div>
      </div>
    ),
    { ...size }
  )
}
