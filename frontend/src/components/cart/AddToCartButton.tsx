'use client'

import { useCart } from '@/lib/cart/CartContext'

type Props = {
  productId: string
  name: string
  priceCents: number
}

export function AddToCartButton({ productId, name, priceCents }: Props) {
  const { addItem } = useCart()

  return (
    <button
      onClick={() => addItem({ productId, name, priceCents })}
      className="mt-2 rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-800"
    >
      Add to cart
    </button>
  )
}
