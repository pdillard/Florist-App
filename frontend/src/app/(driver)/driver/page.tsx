import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DeliveryCard } from '@/components/driver/DeliveryCard'
import { StatusBadge } from '@/components/shared/StatusBadge'

// Without generated Supabase types, the client can't tell that
// order:orders(...) is a many-to-one embed (one order per delivery) and
// infers it as an array instead, which doesn't match what actually comes
// back at runtime. This type describes the real shape; the cast below
// tells TypeScript to trust it.
type DeliveryRow = {
  id: string
  order_id: string
  assigned_at: string | null
  picked_up_at: string | null
  delivered_at: string | null
  failure_reason: string | null
  order: {
    id: string
    status: string
    recipient_name: string | null
    recipient_phone: string | null
    delivery_address: string
    card_message: string | null
  } | null
}

export default async function DriverPage() {
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

  if (profile?.role !== 'driver') {
    redirect('/')
  }

  const { data: rawDeliveries, error } = await supabase
    .from('deliveries')
    .select(
      'id, order_id, assigned_at, picked_up_at, delivered_at, failure_reason, order:orders(id, status, recipient_name, recipient_phone, delivery_address, card_message)'
    )
    .eq('driver_id', user.id)
    .order('assigned_at', { ascending: false })

  if (error) {
    return <main className="p-8 text-red-600">Error loading deliveries: {error.message}</main>
  }

  const deliveries = (rawDeliveries ?? []) as unknown as DeliveryRow[]

  const activeDeliveries = deliveries.filter(
    (d) => d.order && !['delivered', 'failed', 'cancelled'].includes(d.order.status)
  )
  const pastDeliveries = (deliveries ?? []).filter(
    (d) => d.order && ['delivered', 'failed', 'cancelled'].includes(d.order.status)
  )

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-2">My deliveries</h1>
      <p className="text-gray-500 mb-6">Welcome, {profile.name}</p>

      {activeDeliveries.length === 0 ? (
        <p className="text-gray-500">No active deliveries right now.</p>
      ) : (
        <div className="space-y-4">
          {activeDeliveries.map((delivery) => (
            <DeliveryCard key={delivery.id} delivery={delivery} />
          ))}
        </div>
      )}

      {pastDeliveries.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 font-semibold text-gray-500">Completed</h2>
          <div className="space-y-2">
            {pastDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="flex items-center justify-between rounded-lg border p-3 text-sm text-gray-500"
              >
                <span>{delivery.order?.recipient_name}</span>
                <StatusBadge status={delivery.order?.status ?? ''} />
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
