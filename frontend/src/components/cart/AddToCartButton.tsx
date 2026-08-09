'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart/CartContext'

type Props = {
  productId: string
  name: string
  priceCents: number
}

export function AddToCartButton({ productId, name, priceCents }: Props) {
  const { addItem } = useCart()
  // This click never touches the network, it's instant, but with nothing
  // else on screen to confirm it worked (the cart count is up in the
  // header, easy to miss) it can still feel like the click didn't
  // register. A brief "Added" flash closes that gap.
  const [justAdded, setJustAdded] = useState(false)

  function handleClick() {
    addItem({ productId, name, priceCents })
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1000)
  }

  return (
    <button
      onClick={handleClick}
      className="mt-2 rounded bg-black px-3 py-1.5 text-sm text-white transition-all duration-150 ease-out hover:bg-gray-800 active:scale-[0.97]"
    >
      {justAdded ? 'Added' : 'Add to cart'}
    </button>
  )
}
