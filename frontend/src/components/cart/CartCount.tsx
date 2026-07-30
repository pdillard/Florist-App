'use client'

import Link from 'next/link'
import { useCart } from '@/lib/cart/CartContext'

export function CartCount() {
  const { itemCount } = useCart()

  return (
    <Link href="/cart" data-testid="cart-count">
      Cart ({itemCount})
    </Link>
  )
}
