import { Flower2 } from 'lucide-react'
import { Button } from '@/components/shared/Button'

// Next's special file: renders for any unmatched route (and any manual
// notFound() call, e.g. the merchant order detail page). Before this,
// a bad link showed Next's bare default 404 - inconsistent with
// everything else on the site.
export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        <Flower2 className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-sm text-gray-500">
        Whatever you were looking for isn&apos;t here &mdash; it may have moved, or the link
        might be off.
      </p>
      <Button href="/" variant="accent" className="mt-7 px-6 py-2.5">
        Back home
      </Button>
    </main>
  )
}
