import { AlertCircle } from 'lucide-react'

// One error treatment for the whole app instead of every form rolling its
// own `<p className="text-red-600">`. A boxed, icon-led error reads as
// "the app is telling you something" - a bare line of red text near a
// button is easy to miss, especially on a phone mid-delivery.
export function ErrorMessage({ children }: { children: React.ReactNode }) {
  if (!children) return null

  return (
    <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}
