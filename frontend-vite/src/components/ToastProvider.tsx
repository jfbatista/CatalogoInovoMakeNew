import React, { createContext, useContext, useMemo, useState } from 'react'

export interface ToastItem {
  id: string
  type?: 'success' | 'error' | 'info'
  message: string
}

interface ToastContextValue {
  show: (msg: string, type?: ToastItem['type']) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const api: ToastContextValue = useMemo(() => ({
    show: (message, type = 'info') => {
      const id = Math.random().toString(36).slice(2)
      setItems(prev => [...prev, { id, type, message }])
      setTimeout(() => setItems(prev => prev.filter(i => i.id !== id)), 2500)
    }
  }), [])

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Portal simples no final do body/root */}
      <div className="fixed bottom-4 right-4 space-y-2 z-[100]">
        {items.map(t => (
          <div key={t.id} className={`px-3 py-2 rounded-md text-sm shadow border border-border bg-surface ${
            t.type === 'success' ? 'text-emerald-300 border-emerald-700/40' : t.type === 'error' ? 'text-red-300 border-red-700/40' : 'text-gray-200'
          }`}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
