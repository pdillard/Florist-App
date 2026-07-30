'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

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

const STORAGE_KEY = 'florist-cart'

export function CartProvider({ children }: { children: ReactNode }) {
  // Start empty so server-rendered HTML and first client render match.
  // Real cart is loaded from localStorage after mount, in the effect below.
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        setItems(JSON.parse(raw))
      } catch {
        // corrupted storage, ignore and start fresh
      }
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    // Don't overwrite storage with the empty initial state before we've
    // actually loaded from it once.
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, hydrated])

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
