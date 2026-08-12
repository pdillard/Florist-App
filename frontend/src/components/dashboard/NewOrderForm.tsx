'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, PackagePlus, Trash2, Truck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/shared/Button'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { EmptyState } from '@/components/shared/EmptyState'
import { INPUT_STYLES } from '@/lib/ui'

type Product = {
  id: string
  name: string
  price_cents: number
  stock_qty: number
}

type LineItem = {
  productId: string
  name: string
  priceCents: number
  qty: number
}

export function NewOrderForm({ products }: { products: Product[] }) {
  const [items, setItems] = useState<LineItem[]>([])
  const [pickerProductId, setPickerProductId] = useState(products[0]?.id ?? '')
  const [pickerQty, setPickerQty] = useState(1)

  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [cardMessage, setCardMessage] = useState('')
  // datetime-local gives a plain string with no timezone (e.g.
  // "2026-08-01T10:00"). Postgres will cast it to timestamptz using the
  // database session's timezone, not the merchant's actual local time.
  // Fine for now, worth real timezone handling before this matters for
  // real delivery windows.
  const [windowStart, setWindowStart] = useState('')
  const [windowEnd, setWindowEnd] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const subtotalCents = items.reduce((sum, i) => sum + i.qty * i.priceCents, 0)

  function addItem() {
    const product = products.find((p) => p.id === pickerProductId)
    if (!product || pickerQty <= 0) return

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, qty: i.qty + pickerQty } : i
        )
      }
      return [
        ...prev,
        { productId: product.id, name: product.name, priceCents: product.price_cents, qty: pickerQty },
      ]
    })
    setPickerQty(1)
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (items.length === 0) {
      setError('Add at least one item')
      return
    }

    setSubmitting(true)

    const { data, error } = await supabase.rpc('merchant_create_order', {
      p_items: items.map((i) => ({ product_id: i.productId, qty: i.qty })),
      p_recipient_name: recipientName,
      p_recipient_phone: recipientPhone,
      p_delivery_address: deliveryAddress,
      p_card_message: cardMessage || null,
      p_delivery_window_start: windowStart || null,
      p_delivery_window_end: windowEnd || null,
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    setPlacedOrderId(data as string)
    setSubmitting(false)
  }

  function handleNewOrder() {
    setItems([])
    setRecipientName('')
    setRecipientPhone('')
    setDeliveryAddress('')
    setCardMessage('')
    setWindowStart('')
    setWindowEnd('')
    setPlacedOrderId(null)
  }

  if (placedOrderId) {
    return (
      <div className="max-w-lg rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-600">
          <CheckCircle2 className="h-5 w-5" />
          <p className="font-semibold">Order placed</p>
        </div>
        <p className="mt-1 text-sm text-gray-500">Order ID: {placedOrderId}</p>
        <div className="mt-4 flex gap-3">
          <Button onClick={handleNewOrder}>Enter another order</Button>
          <Button variant="secondary" onClick={() => router.push('/dashboard')}>
            Back to dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackagePlus}
        title="No active products in your catalog yet"
        description="Add your flowers and arrangements to Inventory first, then come back here to enter an order."
        action={
          <Button href="/dashboard/inventory" variant="secondary">
            Go to Inventory
          </Button>
        }
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-2 flex items-center gap-1.5 font-semibold">
          <PackagePlus className="h-4 w-4 text-rose-500" />
          Items
        </h2>

        <div className="mb-3 flex items-end gap-2">
          <select
            value={pickerProductId}
            onChange={(e) => setPickerProductId(e.target.value)}
            className={`flex-1 ${INPUT_STYLES}`}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (${(p.price_cents / 100).toFixed(2)})
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={pickerQty}
            onChange={(e) => setPickerQty(Number(e.target.value))}
            className={`w-20 ${INPUT_STYLES}`}
          />
          <Button type="button" variant="secondary" onClick={addItem}>
            Add
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No items added yet.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between rounded-lg border bg-gray-50 p-2.5 text-sm"
              >
                <span>
                  {item.qty} x {item.name}
                </span>
                <div className="flex items-center gap-3">
                  <span>${((item.qty * item.priceCents) / 100).toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Remove ${item.name} from order`}
                    className="flex items-center gap-1 text-red-600 transition-colors hover:text-red-800"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <p className="text-right font-semibold">
              Total: ${(subtotalCents / 100).toFixed(2)}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-1.5 font-semibold">
          <Truck className="h-4 w-4 text-rose-500" />
          Delivery details
        </h2>
        <input
          className={`w-full ${INPUT_STYLES}`}
          placeholder="Recipient name"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          required
        />
        <input
          className={`w-full ${INPUT_STYLES}`}
          placeholder="Recipient phone"
          value={recipientPhone}
          onChange={(e) => setRecipientPhone(e.target.value)}
          required
        />
        <input
          className={`w-full ${INPUT_STYLES}`}
          placeholder="Delivery address"
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
          required
        />
        <textarea
          className={`w-full ${INPUT_STYLES}`}
          placeholder="Card message (optional)"
          value={cardMessage}
          onChange={(e) => setCardMessage(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm text-gray-500">
            Delivery window start (optional)
            <input
              type="datetime-local"
              className={`mt-1 w-full ${INPUT_STYLES}`}
              value={windowStart}
              onChange={(e) => setWindowStart(e.target.value)}
            />
          </label>
          <label className="text-sm text-gray-500">
            Delivery window end (optional)
            <input
              type="datetime-local"
              className={`mt-1 w-full ${INPUT_STYLES}`}
              value={windowEnd}
              onChange={(e) => setWindowEnd(e.target.value)}
            />
          </label>
        </div>
      </div>

      <ErrorMessage>{error}</ErrorMessage>

      <Button type="submit" variant="accent" loading={submitting} className="w-full py-2.5">
        Place order
      </Button>
    </form>
  )
}
