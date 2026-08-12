import type { MetadataRoute } from 'next'

// Lets a merchant or driver "Add to Home Screen" and get a real app-like
// icon + name instead of a browser bookmark - relevant here specifically
// because the driver app is meant to be opened once per delivery, on a
// phone, which is exactly the case a home screen icon is for.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Florist Delivery Platform',
    short_name: 'Florist Delivery',
    description: 'Delivery dispatch, live tracking, and proof of delivery for local florists.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#e11d48',
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
