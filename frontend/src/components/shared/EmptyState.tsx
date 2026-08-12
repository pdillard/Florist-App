import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

// One "nothing here yet" treatment instead of a lone line of gray text -
// an icon and a little breathing room turns "empty" into "you're caught
// up" or "here's what to do next," which is a meaningfully different
// feeling for someone checking this screen for the tenth time today.
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 px-6 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 font-medium text-gray-700">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
