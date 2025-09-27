import { useEffect, useMemo, useState } from 'react'
import { useCart } from '../context/CartContext'
import { depositosService } from '../services/depositos'
import { useToast } from '../components/ToastProvider'

export default function Checkout({ depositoId }: { depositoId: string | null }) {
  const { items, total, clear } = useCart()
  const [nome, setNome] = useState('')
  const [telefoneCliente, setTelefoneCliente] = useState('')
  const [whatsLoja, setWhatsLoja] = useState<string>('')
  const { show } = useToast()

  useEffect(() => {
    let active = true
    async function load() {
      if (!depositoId) return setWhatsLoja('5561984498130')
      try {
        const numero = await depositosService.getWhatsapp(depositoId)
        if (active) setWhatsLoja(numero)
      } catch {
        if (active) setWhatsLoja('5561984498130')
      }
    }
    load()
    return () => { active = false }
  }, [depositoId])

  const mensagem = useMemo(() => {
    const linhas = [
      'Olá! Gostaria de finalizar este pedido:',
      '',
      ...items.map((it) => `• ${it.quantity}x ${it.name} — R$ ${(it.price).toFixed(2)} (subtotal R$ ${(it.quantity * it.price).toFixed(2)})`),
      '',
      `Total: R$ ${total.toFixed(2)}`,
    ]
    if (nome) linhas.push(`Nome: ${nome}`)
    if (telefoneCliente) linhas.push(`Telefone: ${telefoneCliente}`)
    return encodeURIComponent(linhas.join('\n'))
  }, [items, total, nome, telefoneCliente])

  const link = whatsLoja ? `https://wa.me/${whatsLoja}?text=${mensagem}` : '#'

  // máscara simples para telefone BR (somente dígitos -> 55XX9XXXXYYYY)
  function maskPhone(value: string) {
    const digits = value.replace(/\D+/g, '')
    return digits
  }

  if (items.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-xl font-bold mb-4">Checkout</h1>
        <p className="text-gray-500">Seu carrinho está vazio.</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <h1 className="text-xl font-bold mb-4">Checkout</h1>

      <div className="space-y-3 mb-6">
        <div>
          <label className="block text-sm mb-1">Seu nome (opcional)</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-surface border border-border rounded px-3 py-2" placeholder="Ex.: Maria Souza" />
        </div>
        <div>
          <label className="block text-sm mb-1">Seu telefone (opcional)</label>
          <input value={telefoneCliente} onChange={(e) => setTelefoneCliente(maskPhone(e.target.value))} className="w-full bg-surface border border-border rounded px-3 py-2" placeholder="Ex.: 61999999999" />
        </div>
      </div>

      <div className="border border-border rounded-lg p-4 bg-surface">
        <h2 className="font-semibold mb-2">Resumo</h2>
        <ul className="text-sm text-gray-300 mb-3">
          {items.map((it) => (
            <li key={it.productId}>{it.quantity}x {it.name} — R$ {(it.quantity * it.price).toFixed(2)}</li>
          ))}
        </ul>
        <div className="text-xs text-gray-400 mb-2">WhatsApp da loja: <span className="font-mono">{whatsLoja || '—'}</span>
          <button
            className="ml-2 text-xs border border-border rounded px-2 py-1 hover:border-primary hover:text-primary"
            onClick={() => {
              if (!whatsLoja) return
              navigator.clipboard.writeText(whatsLoja).then(() => show('Número da loja copiado', 'success'))
            }}
            disabled={!whatsLoja}
          >
            Copiar
          </button>
        </div>
        <div className="flex justify-between mb-2"><span>Total</span><span className="font-semibold">R$ {total.toFixed(2)}</span></div>
        <div className="text-xs text-gray-400 mb-4">Entrega e condições serão combinadas pelo WhatsApp da loja.</div>
        <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
          Finalizar no WhatsApp
        </a>
        <button className="ml-2 inline-flex items-center gap-2 border border-border px-4 py-2 rounded-md" onClick={() => clear()}>Limpar carrinho</button>
      </div>
    </div>
  )
}
