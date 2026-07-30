'use client'

import { useCart } from '@/lib/cart/CartContext'

export function CartCount() {
  const { itemCount } = useCart()

  return <span data-testid="cart-count">Cart ({itemCount})</span>
}
