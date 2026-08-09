import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DriverAvailabilityToggle } from '@/components/dashboard/DriverAvailabilityToggle'
import { DriverInviteCode } from '@/components/dashboard/DriverInviteCode'
import { MerchantNav } from '@/components/dashboard/MerchantNav'

// See the comment in (driver)/driver/page.tsx: without generated Supabase
// types, a many-to-one embed (driver:profiles!user_id, one profile per
// driver_profiles row) is inferred as an array. This describes the real
// shape returned at runtime.
type DriverRow = {
  user_id: string
  vehicle_type: string | null
  license_plate: string | null
  is_available: boolean
  driver: { name: string | null; phone: string | null } | null
}

export default async function DriversPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, merchant_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'merchant') {
    redirect('/')
  }

  const [{ data: rawDrivers, error }, { data: merchant }] = await Promise.all([
    supabase
      .from('driver_profiles')
      .select('user_id, vehicle_type, license_plate, is_available, driver:profiles!user_id(name, phone)'),
    supabase.from('merchants').select('invite_code').eq('id', profile.merchant_id).single(),
  ])

  if (error) {
    return <main className="p-8 text-red-600">Error loading drivers: {error.message}</main>
  }

  const drivers = (rawDrivers ?? []) as unknown as DriverRow[]

  return (
    <main className="p-8">
      <MerchantNav />
      <h1 className="text-2xl font-bold mb-6">Drivers</h1>

      {merchant?.invite_code && <DriverInviteCode inviteCode={merchant.invite_code} />}

      {!drivers || drivers.length === 0 ? (
        <p className="text-gray-500">
          No drivers yet. Share the invite code above and have them sign up with the driver role
          &mdash; they will show up here.
        </p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="py-2">Name</th>
              <th>Phone</th>
              <th>Vehicle</th>
              <th>License plate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.user_id} className="border-b">
                <td className="py-2">{d.driver?.name ?? 'Unnamed driver'}</td>
                <td>{d.driver?.phone ?? '—'}</td>
                <td>{d.vehicle_type ?? '—'}</td>
                <td>{d.license_plate ?? '—'}</td>
                <td>
                  <DriverAvailabilityToggle userId={d.user_id} isAvailable={d.is_available} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
