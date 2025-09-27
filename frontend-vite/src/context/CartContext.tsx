import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Product } from '../types'

export interface CartItem {
  productId: string
  name: string
  price: number
  image?: string
  quantity: number
}

interface CartContextValue {
  items: CartItem[]
  count: number
  total: number
  add: (p: { product: Product; image?: string; quantity?: number }) => void
  remove: (productId: string) => void
  clear: () => void
  setQty: (productId: string, qty: number) => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

const KEY = 'cart:v1'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as CartItem[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items))
  }, [items])

  const api: CartContextValue = useMemo(() => ({
    items,
    count: items.reduce((sum, it) => sum + it.quantity, 0),
    total: items.reduce((sum, it) => sum + it.quantity * it.price, 0),
    add: ({ product, image, quantity = 1 }) => {
      setItems(prev => {
        const idx = prev.findIndex(i => i.productId === product._id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity }
          return next
        }
        return [
          ...prev,
          {
            productId: product._id,
            name: product.Nome,
            price: Number(product.Preco ?? 0),
            image,
            quantity
          }
        ]
      })
    },
    remove: (productId) => setItems(prev => prev.filter(i => i.productId !== productId)),
    clear: () => setItems([]),
    setQty: (productId, qty) => setItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: Math.max(1, qty) } : i))
  }), [items])

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
