import { useCart } from '../context/CartContext'
import { useNavigate, Link } from 'react-router-dom'
import { useToast } from '../components/ToastProvider'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useState } from 'react'

export default function Cart() {
  const { items, total, remove, setQty, clear } = useCart()
  const navigate = useNavigate()
  const { show } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (items.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-xl font-bold mb-4">Seu carrinho</h1>
        <p className="text-gray-500">Seu carrinho está vazio.</p>
        <button className="mt-4 bg-primary text-white px-4 py-2 rounded-md" onClick={() => navigate('/')}>Voltar às compras</button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <h1 className="text-xl font-bold mb-4">Seu carrinho</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {items.map((it) => (
            <div key={it.productId} className="flex items-center gap-3 border border-border rounded-lg p-3 bg-surface">
              <img src={it.image || '/sem-imagem.svg'} className="w-20 h-20 object-cover rounded border border-border" onError={(e) => (e.currentTarget.src = '/sem-imagem.svg')} />
              <div className="flex-1 min-w-0">
                <Link to={`/produto/${it.productId}`} className="font-medium hover:text-primary line-clamp-1">{it.name}</Link>
                <div className="text-sm price-text">R$ {it.price.toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button aria-label="Diminuir" className="w-9 h-9 text-lg border border-border rounded-md active:scale-[0.98]" onClick={() => { setQty(it.productId, Math.max(1, it.quantity - 1)); show('Quantidade atualizada', 'info') }}>−</button>
                <input
                  className="w-14 h-9 text-center bg-surface border border-border rounded-md price-text"
                  value={it.quantity}
                  onChange={(e) => setQty(it.productId, Math.max(1, parseInt(e.target.value) || 1))}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp') { e.preventDefault(); setQty(it.productId, it.quantity + 1); show('Quantidade atualizada', 'info') }
                    if (e.key === 'ArrowDown') { e.preventDefault(); setQty(it.productId, Math.max(1, it.quantity - 1)); show('Quantidade atualizada', 'info') }
                  }}
                  inputMode="numeric"
                />
                <button aria-label="Aumentar" className="w-9 h-9 text-lg border border-border rounded-md active:scale-[0.98]" onClick={() => { setQty(it.productId, it.quantity + 1); show('Quantidade atualizada', 'info') }}>+</button>
              </div>
              <div className="w-28 text-right font-semibold price-text">R$ {(it.quantity * it.price).toFixed(2)}</div>
              <button className="ml-2 text-sm text-red-400 hover:text-red-300" onClick={() => { remove(it.productId); show('Item removido do carrinho', 'info') }}>Remover</button>
            </div>
          ))}
        </div>
        <aside className="border border-border rounded-lg p-4 h-fit bg-surface">
          <div className="flex justify-between mb-2"><span>Subtotal</span><span className="font-semibold price-text">R$ {total.toFixed(2)}</span></div>
          <div className="text-xs text-gray-400 mb-4">Frete e condições a combinar pelo WhatsApp.</div>
          <button className="w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-600" onClick={() => navigate('/checkout')}>Finalizar pedido</button>
          <div className="flex gap-2 mt-2">
            <button className="flex-1 border border-border px-4 py-2 rounded-md" onClick={() => navigate('/')}>Continuar comprando</button>
            <button className="flex-1 border border-border px-4 py-2 rounded-md" onClick={() => setConfirmOpen(true)}>Limpar carrinho</button>
          </div>
        </aside>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Limpar carrinho?"
        description="Essa ação removerá todos os itens do seu carrinho. Deseja continuar?"
        confirmText="Sim, limpar"
        cancelText="Cancelar"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => { clear(); setConfirmOpen(false); show('Carrinho limpo', 'info') }}
      />
    </div>
  )
}
