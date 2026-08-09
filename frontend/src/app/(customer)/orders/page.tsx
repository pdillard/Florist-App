import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/shared/StatusBadge'

export default async function OrdersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, status, recipient_name, delivery_address, total_cents, created_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return <main className="p-8 text-red-600">Error loading orders: {error.message}</main>
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Your orders</h1>

      {!orders || orders.length === 0 ? (
        <p className="text-gray-500">
          No orders yet. <Link href="/shop" className="underline">Browse the shop</Link>.
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/track/${order.id}`}
              className="block rounded-lg border p-4 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{order.recipient_name ?? '—'}</p>
                  <p className="text-sm text-gray-500">{order.delivery_address}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={order.status} />
                  <p className="mt-1 text-sm text-gray-500">
                    ${(order.total_cents / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
