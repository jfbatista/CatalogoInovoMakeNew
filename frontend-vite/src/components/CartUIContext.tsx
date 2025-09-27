import React, { createContext, useContext, useMemo, useState, useCallback } from 'react'
import { MiniCartDrawer } from './MiniCartDrawer'

interface CartUIContextValue {
  openDrawer: (lastAddedId?: string | null) => void
  closeDrawer: () => void
}

const CartUIContext = createContext<CartUIContextValue | undefined>(undefined)

export function CartUIProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [lastAddedId, setLastAddedId] = useState<string | null>(null)

  const openDrawer = useCallback((id?: string | null) => {
    if (id) setLastAddedId(id)
    setOpen(true)
  }, [])
  const closeDrawer = useCallback(() => setOpen(false), [])

  const value = useMemo(() => ({ openDrawer, closeDrawer }), [openDrawer, closeDrawer])

  return (
    <CartUIContext.Provider value={value}>
      {children}
      <MiniCartDrawer open={open} onClose={closeDrawer} lastAddedId={lastAddedId} />
    </CartUIContext.Provider>
  )
}

export function useCartUI() {
  const ctx = useContext(CartUIContext)
  if (!ctx) throw new Error('useCartUI must be used within CartUIProvider')
  return ctx
}
