'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/lib/cart/CartContext'
import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/shared/Button'

export default function CheckoutPage() {
  const { items, subtotalCents, clear } = useCart()
  const { user, loading: checkingAuth } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [cardMessage, setCardMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (!checkingAuth && !user) {
      router.push('/login')
    }
  }, [checkingAuth, user, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { data, error } = await supabase.rpc('create_order', {
      p_items: items.map((i) => ({ product_id: i.productId, qty: i.qty })),
      p_recipient_name: recipientName,
      p_recipient_phone: recipientPhone,
      p_delivery_address: deliveryAddress,
      p_card_message: cardMessage || null,
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    clear()
    setPlacedOrderId(data as string)
    setSubmitting(false)
  }

  if (checkingAuth || !user) {
    return <main className="p-8">Checking sign-in...</main>
  }

  if (placedOrderId) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-2">Order placed</h1>
        <p className="mb-4 text-gray-600">Order ID: {placedOrderId}</p>
        <Link href={`/track/${placedOrderId}`} className="underline">
          Track this order
        </Link>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="p-8">
        <p className="text-gray-500">Your cart is empty, nothing to check out.</p>
      </main>
    )
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
        <input
          className="w-full rounded border p-2"
          placeholder="Recipient name"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          required
        />
        <input
          className="w-full rounded border p-2"
          placeholder="Recipient phone"
          value={recipientPhone}
          onChange={(e) => setRecipientPhone(e.target.value)}
          required
        />
        <input
          className="w-full rounded border p-2"
          placeholder="Delivery address"
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
          required
        />
        <textarea
          className="w-full rounded border p-2"
          placeholder="Card message (optional)"
          value={cardMessage}
          onChange={(e) => setCardMessage(e.target.value)}
        />

        <p className="text-lg font-semibold">
          Total: ${(subtotalCents / 100).toFixed(2)}
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" loading={submitting} className="w-full p-2">
          Place order
        </Button>
      </form>
    </main>
  )
}
