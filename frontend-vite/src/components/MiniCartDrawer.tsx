import React, { useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { useNavigate } from 'react-router-dom'
import { useToast } from './ToastProvider'

export function MiniCartDrawer({ open, onClose, lastAddedId }: { open: boolean; onClose: () => void; lastAddedId?: string | null }) {
  const { items, total, remove, setQty } = useCart()
  const navigate = useNavigate()
  const { show } = useToast()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div className={`fixed inset-0 z-[110] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      {/* backdrop */}
      <div className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ease-out ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      {/* panel */}
      <aside className={`absolute right-0 top-0 h-full w-full max-w-md bg-surface border-l border-border shadow-xl transition-transform duration-200 ease-out ${open ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <header className="p-4 border-b border-border shrink-0 flex items-center justify-between">
          <h3 className="font-semibold">Resumo do carrinho <span className="text-xs text-gray-400 align-middle">({items.length} item{items.length === 1 ? '' : 's'})</span></h3>
          <button className="px-3 py-1.5 border border-border rounded-md hover:border-primary" onClick={onClose}>Fechar</button>
        </header>
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {items.length === 0 ? (
            <div className="text-sm text-gray-400">Seu carrinho está vazio.</div>
          ) : (
            items.map((it) => (
              <div key={it.productId} className={`flex items-center gap-3 border rounded-lg p-3 ${it.productId === lastAddedId ? 'border-primary/40 bg-primary/5 animate-highlight' : 'border-border'}`}>
                <img src={it.image || '/sem-imagem.svg'} className="w-14 h-14 object-cover rounded border border-border" onError={(e) => (e.currentTarget.src = '/sem-imagem.svg')} />
                <div className="flex-1 min-w-0">
                  <div className="line-clamp-1 text-sm">{it.name}</div>
                  <div className="text-xs text-gray-400">R$ {it.price.toFixed(2)}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <button className="w-7 h-7 text-sm border border-border rounded" onClick={() => setQty(it.productId, Math.max(1, it.quantity - 1))}>−</button>
                    <input className="w-12 h-7 text-center bg-surface border border-border rounded" value={it.quantity} onChange={(e) => setQty(it.productId, Math.max(1, parseInt(e.target.value) || 1))} />
                    <button className="w-7 h-7 text-sm border border-border rounded" onClick={() => setQty(it.productId, it.quantity + 1)}>+</button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">R$ {(it.quantity * it.price).toFixed(2)}</div>
                  <button className="mt-1 text-xs text-red-400 hover:text-red-300" onClick={() => { remove(it.productId); show('Item removido do carrinho', 'info') }}>Remover</button>
                </div>
              </div>
            ))
          )}
        </div>
        <footer className="p-4 border-t border-border shrink-0">
          <div className="flex justify-between mb-3"><span>Total</span><span className="font-semibold">R$ {total.toFixed(2)}</span></div>
          <div className="space-y-2">
            {lastAddedId && items.some(i => i.productId === lastAddedId) && (
              <button className="w-full border border-border px-3 py-2 rounded-md text-sm" onClick={() => { remove(lastAddedId); show('Último item desfeito', 'info') }}>Desfazer</button>
            )}
            <button className="w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-600" onClick={() => { navigate('/checkout'); onClose() }}>Finalizar pedido</button>
            <div className="flex gap-2">
              <button className="flex-1 border border-border px-4 py-2 rounded-md" onClick={() => { navigate('/carrinho'); onClose() }}>Ver carrinho</button>
              <button className="flex-1 border border-border px-4 py-2 rounded-md" onClick={() => { navigate('/'); onClose() }}>Continuar comprando</button>
            </div>
          </div>
        </footer>
      </aside>
    </div>
  )
}
