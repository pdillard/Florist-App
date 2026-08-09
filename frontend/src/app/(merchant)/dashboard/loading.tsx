import { PageSkeleton } from '@/components/shared/PageSkeleton'

// Covers /dashboard and every page nested under it (drivers, inventory,
// new-order, orders/[orderId]) since none of them define their own
// loading.tsx. Shown automatically by Next.js while the page's server data
// is still loading, instead of a frozen blank screen.
export default function Loading() {
  return <PageSkeleton />
}
