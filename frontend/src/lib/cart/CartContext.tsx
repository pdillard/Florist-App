'use client'

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'

export type CartItem = {
  productId: string
  name: string
  priceCents: number
  qty: number
}

type CartContextValue = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  clear: () => void
  itemCount: number
  subtotalCents: number
}

const CartContext = createContext<CartContextValue | null>(null)

// Cart is scoped per signed-in user (or 'guest' when logged out), so
// switching accounts in the same browser doesn't show one person's cart
// to another. Each owner gets its own localStorage slot.
function storageKeyFor(ownerId: string) {
  return `florist-cart:${ownerId}`
}

function loadCart(ownerId: string): CartItem[] {
  const raw = localStorage.getItem(storageKeyFor(ownerId))
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  // AuthContext is the single source of truth for who's signed in.
  // CartProvider must be nested inside AuthProvider for this to work.
  const { user } = useAuth()
  const ownerId = user?.id ?? 'guest'

  // Start empty so server-rendered HTML and first client render match.
  // Real cart is loaded from localStorage after mount, in the effect below.
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const loadedOwnerRef = useRef<string | null>(null)

  useEffect(() => {
    // Only reload from storage when the owner actually changes (login,
    // logout, switching accounts) - not on every render.
    if (loadedOwnerRef.current !== ownerId) {
      loadedOwnerRef.current = ownerId
      setItems(loadCart(ownerId))
      setHydrated(true)
    }
  }, [ownerId])

  useEffect(() => {
    // Don't overwrite storage with the empty initial state before we've
    // actually loaded from it once.
    if (hydrated) {
      localStorage.setItem(storageKeyFor(ownerId), JSON.stringify(items))
    }
  }, [items, hydrated, ownerId])

  function addItem(item: Omit<CartItem, 'qty'>, qty = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId)
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, qty: i.qty + qty } : i
        )
      }
      return [...prev, { ...item, qty }]
    })
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) {
      removeItem(productId)
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, qty } : i))
    )
  }

  function clear() {
    setItems([])
  }

  const itemCount = items.reduce((sum, i) => sum + i.qty, 0)
  const subtotalCents = items.reduce((sum, i) => sum + i.qty * i.priceCents, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQty, clear, itemCount, subtotalCents }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used inside a CartProvider')
  }
  return ctx
}
