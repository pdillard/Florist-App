import { createClient } from '@/lib/supabase/server'
import { AddToCartButton } from '@/components/cart/AddToCartButton'

export default async function ShopPage() {
  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, price_cents, stock_qty')
    .eq('is_active', true)

  if (error) {
    return (
      <main className="p-8">
        <p className="text-red-600">Error loading products: {error.message}</p>
      </main>
    )
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Shop</h1>

      {products.length === 0 ? (
        <p className="text-gray-500">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {products.map((product) => (
            <div key={product.id} className="rounded-lg border p-4">
              <h2 className="font-semibold">{product.name}</h2>
              <p>${(product.price_cents / 100).toFixed(2)}</p>
              <p className="text-sm text-gray-500">{product.stock_qty} in stock</p>
              <AddToCartButton
                productId={product.id}
                name={product.name}
                priceCents={product.price_cents}
              />
            </div>
          ))}
        </div>
      )}
    </main>
  )
}