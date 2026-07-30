'use client'

import Link from 'next/link'
import { useCart } from '@/lib/cart/CartContext'

export default function CartPage() {
  const { items, updateQty, removeItem, subtotalCents } = useCart()

  if (items.length === 0) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">Your cart</h1>
        <p className="text-gray-500">
          Your cart is empty. <Link href="/shop" className="underline">Browse the shop</Link>.
        </p>
      </main>
    )
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Your cart</h1>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-gray-500">
                ${(item.priceCents / 100).toFixed(2)} each
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                value={item.qty}
                onChange={(e) =>
                  updateQty(item.productId, Number(e.target.value))
                }
                className="w-16 rounded border px-2 py-1 text-center"
              />
              <p className="w-20 text-right">
                ${((item.priceCents * item.qty) / 100).toFixed(2)}
              </p>
              <button
                onClick={() => removeItem(item.productId)}
                className="text-sm text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t pt-4">
        <p className="text-lg font-semibold">
          Subtotal: ${(subtotalCents / 100).toFixed(2)}
        </p>
        <Link
          href="/checkout"
          className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
        >
          Checkout
        </Link>
      </div>
    </main>
  )
}
