import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InventoryManager } from '@/components/dashboard/InventoryManager'
import { MerchantNav } from '@/components/dashboard/MerchantNav'

export default async function InventoryPage() {
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
    .select('id, name, description, price_cents, stock_qty, is_active')
    .eq('merchant_id', profile.merchant_id)
    .order('name')

  if (error) {
    return <main className="p-8 text-red-600">Error loading inventory: {error.message}</main>
  }

  return (
    <main className="p-8">
      <MerchantNav />
      <h1 className="text-2xl font-bold mb-6">Inventory</h1>
      <InventoryManager merchantId={profile.merchant_id} products={products ?? []} />
    </main>
  )
}
