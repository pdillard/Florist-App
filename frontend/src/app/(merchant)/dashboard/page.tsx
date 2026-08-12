import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AssignDriverControl } from '@/components/dashboard/AssignDriverControl'
import { MerchantNav } from '@/components/dashboard/MerchantNav'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/shared/Button'

// See the comment in (driver)/driver/page.tsx: without generated Supabase
// types, many-to-one embeds are inferred as arrays. These describe the
// real shapes returned at runtime.
type DeliveryDriverRow = {
  order_id: string
  driver: { name: string | null } | null
}

type AvailableDriverRow = {
  user_id: string
  driver: { name: string | null } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'merchant') {
    redirect('/')
  }

  const [{ data: orders, error }, { data: rawDeliveries }, { data: rawDriverProfiles }] =
    await Promise.all([
      supabase
        .from('orders')
        .select('id, status, payment_status, recipient_name, delivery_address, total_cents, created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('deliveries')
        .select('order_id, driver:profiles!driver_id(name)'),
      supabase
        .from('driver_profiles')
        .select('user_id, driver:profiles!user_id(name)')
        .eq('is_available', true),
    ])

  if (error) {
    return <main className="p-8 text-red-600">Error loading orders: {error.message}</main>
  }

  const deliveries = (rawDeliveries ?? []) as unknown as DeliveryDriverRow[]
  const driverProfiles = (rawDriverProfiles ?? []) as unknown as AvailableDriverRow[]

  // order_id -> assigned driver's name, so we know which orders already
  // have a delivery and don't need the assignment control.
  const assignedDriverByOrder = new Map(
    deliveries.map((d) => [d.order_id, d.driver?.name ?? 'Unnamed driver'])
  )

  const availableDrivers = driverProfiles.map((d) => ({
    id: d.user_id,
    name: d.driver?.name ?? null,
  }))

  // Pending orders need action (assign a driver), surface them first so a
  // busy manager sees what needs attention without hunting for it.
  const sortedOrders = [...orders].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (a.status !== 'pending' && b.status === 'pending') return 1
    return 0
  })

  return (
    <main className="p-8">
      <MerchantNav />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Orders</h1>
          <p className="text-gray-500">Welcome, {profile.name}</p>
        </div>
        <Button href="/dashboard/new-order">
          <Plus className="h-4 w-4" />
          New order
        </Button>
      </div>

      {orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-sm text-gray-500">
                <th className="px-4 py-2.5">Recipient</th>
                <th>Address</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Driver</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map((order) => {
                const assignedDriver = assignedDriverByOrder.get(order.id)
                return (
                  <tr key={order.id} className="border-b transition-colors last:border-b-0 hover:bg-rose-50/40">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="font-medium text-gray-900 hover:text-rose-600 hover:underline"
                      >
                        {order.recipient_name ?? '—'}
                      </Link>
                    </td>
                    <td>{order.delivery_address}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          order.payment_status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td>${(order.total_cents / 100).toFixed(2)}</td>
                    <td className="px-4">
                      {assignedDriver ? (
                        <span className="text-sm">{assignedDriver}</span>
                      ) : (
                        <AssignDriverControl orderId={order.id} drivers={availableDrivers} />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
