export function PageSkeleton() {
  return (
    <main className="p-8">
      {/* Mirrors the shape of a typical dashboard page (nav tabs, title,
          list rows) so the swap from skeleton to real content doesn't
          visibly jump around once data arrives. */}
      <div className="mb-6 flex gap-4 border-b pb-2">
        <div className="skeleton h-4 w-16 rounded" />
        <div className="skeleton h-4 w-20 rounded" />
        <div className="skeleton h-4 w-16 rounded" />
        <div className="skeleton h-4 w-20 rounded" />
      </div>
      <div className="skeleton mb-6 h-8 w-48 rounded" />
      <div className="space-y-3">
        <div className="skeleton h-16 rounded-lg" />
        <div className="skeleton h-16 rounded-lg" />
        <div className="skeleton h-16 rounded-lg" />
      </div>
    </main>
  )
}
