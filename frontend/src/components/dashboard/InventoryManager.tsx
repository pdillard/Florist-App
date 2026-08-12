'use client'

import { useState } from 'react'
import { AlertTriangle, Check, PackagePlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'
import { INPUT_STYLES } from '@/lib/ui'
import { BulkImportProducts } from '@/components/dashboard/BulkImportProducts'

type Product = {
  id: string
  name: string
  description: string | null
  price_cents: number
  stock_qty: number
  is_active: boolean
}

export function InventoryManager({
  merchantId,
  products: initialProducts,
}: {
  merchantId: string
  products: Product[]
}) {
  // Lifted into local state (instead of just reading the server-fetched
  // prop directly) so both adding a product and editing one can update the
  // list, and the low-stock count, immediately without round-tripping back
  // to the server to re-fetch data we already know.
  const [products, setProducts] = useState(initialProducts)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [priceDollars, setPriceDollars] = useState('')
  const [stockQty, setStockQty] = useState('0')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const priceCents = Math.round(parseFloat(priceDollars || '0') * 100)
    if (!name.trim() || isNaN(priceCents) || priceCents <= 0) {
      setError('Enter a name and a valid price')
      return
    }

    setSubmitting(true)

    // Plain client-side insert, not an RPC: RLS's products_merchant_write
    // policy already requires merchant_id to match the caller's own shop
    // (both for reading and for the WITH CHECK on write), so a tampered
    // merchant_id here would just be rejected by the database, not trusted.
    const { data, error } = await supabase
      .from('products')
      .insert({
        merchant_id: merchantId,
        name,
        description: description || null,
        price_cents: priceCents,
        stock_qty: parseInt(stockQty || '0', 10),
        is_active: true,
      })
      .select()
      .single()

    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    setProducts((prev) => [...prev, data as Product].sort((a, b) => a.name.localeCompare(b.name)))
    setName('')
    setDescription('')
    setPriceDollars('')
    setStockQty('0')
  }

  function handleProductUpdate(updated: Product) {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  // BulkImportProducts hands back every row it actually wrote (both new
  // inserts and updates to existing products) in one array - merge each
  // one in by id rather than re-fetching the whole catalog.
  function handleBulkImported(imported: Product[]) {
    setProducts((prev) => {
      const byId = new Map(prev.map((p) => [p.id, p]))
      for (const p of imported) byId.set(p.id, p)
      return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
    })
  }

  const lowStockCount = products.filter((p) => p.is_active && p.stock_qty <= 5).length

  return (
    <div className="space-y-8">
      <BulkImportProducts merchantId={merchantId} products={products} onImported={handleBulkImported} />

      <form onSubmit={handleAddProduct} className="max-w-md space-y-3 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-1.5 font-semibold">
          <PackagePlus className="h-4 w-4 text-rose-500" />
          Add a single product
        </h2>
        <input
          className={`w-full ${INPUT_STYLES}`}
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className={`w-full ${INPUT_STYLES}`}
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex gap-3">
          <input
            className={`w-full ${INPUT_STYLES}`}
            placeholder="Price (dollars)"
            value={priceDollars}
            onChange={(e) => setPriceDollars(e.target.value)}
          />
          <input
            className={`w-full ${INPUT_STYLES}`}
            placeholder="Stock"
            type="number"
            min={0}
            value={stockQty}
            onChange={(e) => setStockQty(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={submitting} className="w-full">
          Add product
        </Button>
      </form>

      <div>
        <div className="mb-3 flex items-center gap-3">
          <h2 className="font-semibold">Catalog</h2>
          {lowStockCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
              <AlertTriangle className="h-3 w-3" />
              {lowStockCount} low on stock
            </span>
          )}
        </div>
        {products.length === 0 ? (
          <p className="text-gray-500">No products yet.</p>
        ) : (
          <div className="space-y-2">
            {products.map((p) => (
              <ProductRow key={p.id} product={p} onUpdate={handleProductUpdate} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProductRow({
  product,
  onUpdate,
}: {
  product: Product
  onUpdate: (product: Product) => void
}) {
  const [priceDollars, setPriceDollars] = useState((product.price_cents / 100).toFixed(2))
  const [stockQty, setStockQty] = useState(String(product.stock_qty))
  const [isActive, setIsActive] = useState(product.is_active)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const supabase = createClient()

  async function handleSave() {
    setError(null)
    setSaved(false)
    const priceCents = Math.round(parseFloat(priceDollars || '0') * 100)
    const stock = parseInt(stockQty || '0', 10)

    if (isNaN(priceCents) || priceCents <= 0 || isNaN(stock) || stock < 0) {
      setError('Invalid price or stock')
      return
    }

    setSubmitting(true)
    const { error } = await supabase
      .from('products')
      .update({ price_cents: priceCents, stock_qty: stock, is_active: isActive })
      .eq('id', product.id)

    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }

    onUpdate({ ...product, price_cents: priceCents, stock_qty: stock, is_active: isActive })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  // Low stock is a heads-up, not a hard rule, chosen to be low enough that
  // a handful of typical orders wouldn't already have emptied it out.
  const LOW_STOCK_THRESHOLD = 5
  const stockNumber = parseInt(stockQty || '0', 10)
  const isLowStock = isActive && !isNaN(stockNumber) && stockNumber <= LOW_STOCK_THRESHOLD

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm shadow-sm transition-colors duration-150 ${
        isLowStock ? 'border-yellow-300 bg-yellow-50' : 'bg-white'
      }`}
    >
      <span className="min-w-[10rem] font-medium">{product.name}</span>
      <label className="flex items-center gap-1 text-gray-500">
        $
        <input
          className={`w-20 ${INPUT_STYLES} py-1`}
          value={priceDollars}
          onChange={(e) => setPriceDollars(e.target.value)}
        />
      </label>
      <label className="flex items-center gap-1 text-gray-500">
        Stock
        <input
          type="number"
          min={0}
          className={`w-20 ${INPUT_STYLES} py-1`}
          value={stockQty}
          onChange={(e) => setStockQty(e.target.value)}
        />
      </label>
      {isLowStock && (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
          <AlertTriangle className="h-3 w-3" />
          Low stock
        </span>
      )}
      <label className="flex items-center gap-1 text-gray-500">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Active
      </label>
      <Button onClick={handleSave} loading={submitting} className="px-3 py-1 text-xs">
        {saved && <Check className="h-3 w-3" />}
        {saved ? 'Saved' : 'Save'}
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
