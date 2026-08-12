import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// Bigger version of icon.tsx for iOS "Add to Home Screen" - a merchant or
// driver who saves this to their home screen (a real thing people do with
// a tool they open every shift) gets an actual icon instead of a
// screenshot thumbnail of the page.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #e11d48, #ec4899)',
          color: 'white',
          fontSize: 96,
          fontWeight: 700,
          fontFamily: 'sans-serif',
        }}
      >
        F
      </div>
    ),
    { ...size }
  )
}
