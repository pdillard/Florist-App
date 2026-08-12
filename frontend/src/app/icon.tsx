import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

// Next's App Router icon convention: this renders to a real favicon.ico-
// equivalent at build time via satori, no image file needed. Before this
// there was no public/ folder at all - every tab showed the default
// Next.js globe icon, which reads as "unfinished" faster than almost
// anything else in a browser.
export default function Icon() {
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
          borderRadius: 7,
          color: 'white',
          fontSize: 20,
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
