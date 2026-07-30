import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

  if (profile?.role !== 'florist') {
    redirect('/')
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, status, recipient_name, delivery_address, total_cents, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return <main className="p-8 text-red-600">Error loading orders: {error.message}</main>
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-6">Welcome, {profile.name}</p>

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
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b">
                <td className="py-2">{order.recipient_name ?? '—'}</td>
                <td>{order.delivery_address}</td>
                <td>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                    {order.status}
                  </span>
                </td>
                <td>${(order.total_cents / 100).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}