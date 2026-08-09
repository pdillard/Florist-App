import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AssignDriverControl } from '@/components/dashboard/AssignDriverControl'
import { MerchantNav } from '@/components/dashboard/MerchantNav'
import { StatusBadge } from '@/components/shared/StatusBadge'

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

  const [{ data: orders, error }, { data: deliveries }, { data: driverProfiles }] =
    await Promise.all([
      supabase
        .from('orders')
        .select('id, status, recipient_name, delivery_address, total_cents, created_at')
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

  // order_id -> assigned driver's name, so we know which orders already
  // have a delivery and don't need the assignment control.
  const assignedDriverByOrder = new Map(
    (deliveries ?? []).map((d) => [d.order_id, d.driver?.name ?? 'Unnamed driver'])
  )

  const availableDrivers = (driverProfiles ?? []).map((d) => ({
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
        <Link
          href="/dashboard/new-order"
          className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          New order
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="py-2">Recipient</th>
              <th>Address</th>
              <th>Status</th>
              <th>Total</th>
              <th>Driver</th>
            </tr>
          </thead>
          <tbody>
            {sortedOrders.map((order) => {
              const assignedDriver = assignedDriverByOrder.get(order.id)
              return (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">
                    <Link href={`/dashboard/orders/${order.id}`} className="hover:underline">
                      {order.recipient_name ?? '—'}
                    </Link>
                  </td>
                  <td>{order.delivery_address}</td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td>${(order.total_cents / 100).toFixed(2)}</td>
                  <td>
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
      )}
    </main>
  )
}
