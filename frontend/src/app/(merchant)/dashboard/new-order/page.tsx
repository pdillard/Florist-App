import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewOrderForm } from '@/components/dashboard/NewOrderForm'

export default async function NewOrderPage() {
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

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, price_cents, stock_qty')
    .eq('merchant_id', profile.merchant_id)
    .eq('is_active', true)
    .order('name')

  if (error) {
    return <main className="p-8 text-red-600">Error loading catalog: {error.message}</main>
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">New order</h1>
      <NewOrderForm products={products ?? []} />
    </main>
  )
}
