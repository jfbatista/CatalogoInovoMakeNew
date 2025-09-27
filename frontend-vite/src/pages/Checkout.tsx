import { useEffect, useMemo, useState } from 'react'
import { useCart } from '../context/CartContext'
import { depositosService } from '../services/depositos'
import { useToast } from '../components/ToastProvider'
import { useNavigate } from 'react-router-dom'

export default function Checkout({ depositoId }: { depositoId: string | null }) {
  const { items, total, clear } = useCart()
  const [nome, setNome] = useState('')
  const [telefoneCliente, setTelefoneCliente] = useState('')
  const [whatsLoja, setWhatsLoja] = useState<string>('')
  const [nomeLoja, setNomeLoja] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const { show } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    async function load() {
      if (!depositoId) return setWhatsLoja('5561984498130')
      try {
        const numero = await depositosService.getWhatsapp(depositoId)
        if (active) setWhatsLoja(numero)
        // tentar buscar o nome/descrição da loja
        try {
          const lista = await depositosService.getAll()
          const dep = lista.find((d: any) => d._id === depositoId)
          const label = dep?.DescricaoReduzida || dep?.Descricao || dep?.Nome || ''
          if (active && label) setNomeLoja(label)
        } catch {}
      } catch {
        if (active) setWhatsLoja('5561984498130')
      }
    }
    load()
    return () => { active = false }
  }, [depositoId])

  const mensagem = useMemo(() => {
    const loja = nomeLoja ? ` — Loja: ${nomeLoja}` : ''
    const header = `🛒 Pedido${loja}:`
    const produtos = items.map((it, idx) => {
      const subtotal = (it.quantity * it.price).toFixed(2).replace('.', ',')
      const unit = it.price.toFixed(2).replace('.', ',')
      return `${idx + 1}) ${it.quantity}× • 💵 R$ ${unit} • 🧮 R$ ${subtotal} • ${it.name}`
    })
    const extras = [] as string[]
    if (nome) extras.push(`🧍 Nome: ${nome}`)
    if (telefoneCliente) extras.push(`📱 Telefone: ${telefoneCliente}`)
    const totalLinha = `Total: R$ ${total.toFixed(2).replace('.', ',')}`
    const texto = [header, '', ...produtos, '', totalLinha, ...extras].join('\n')
    return encodeURIComponent(texto)
  }, [items, total, nome, telefoneCliente, nomeLoja])

  const link = whatsLoja ? `https://wa.me/${whatsLoja}?text=${mensagem}` : '#'

  function handleFinish() {
    if (!whatsLoja) return
    try {
      window.open(link, '_blank', 'noopener')
    } catch {}
    show('Pedido enviado pelo WhatsApp', 'success')
    clear()
    setSuccess(true)
    setTimeout(() => navigate('/'), 2500)
  }

  // máscara simples para telefone BR (somente dígitos -> 55XX9XXXXYYYY)
  function maskPhone(value: string) {
    const digits = value.replace(/\D+/g, '')
    return digits
  }

  if (items.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <div className="mb-3">
        <button onClick={() => navigate('/')} className="text-sm text-primary hover:underline">← Voltar às compras</button>
      </div>
      <h1 className="text-xl font-bold mb-4">Checkout</h1>
        <p className="text-gray-500">Seu carrinho está vazio.</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl">
      {success && (
        <div className="mb-4 p-3 rounded-md border border-emerald-800/40 bg-emerald-900/20 text-emerald-200 flex items-center justify-between">
          <span>Pedido enviado com sucesso. Você pode acompanhar pelo WhatsApp.</span>
          <button className="ml-4 px-3 py-1.5 rounded-md border border-emerald-700 hover:bg-emerald-700/20" onClick={() => navigate('/')}>Voltar à Home agora</button>
        </div>
      )}
      <h1 className="text-xl font-bold mb-4">Checkout</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Coluna esquerda: dados mínimos do cliente */}
        <section className="md:col-span-1 border border-border rounded-lg p-4 bg-surface h-fit">
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Seu nome</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-surface border border-border rounded px-3 py-2" placeholder="Ex.: Maria Souza" />
            </div>
            <div>
              <label className="block text-sm mb-1">Seu telefone</label>
              <input value={telefoneCliente} onChange={(e) => setTelefoneCliente(maskPhone(e.target.value))} className="w-full bg-surface border border-border rounded px-3 py-2" placeholder="Ex.: 61999999999" />
            </div>
            <div className="text-xs text-gray-400">WhatsApp da loja: <span className="font-mono">{whatsLoja || '—'}</span>
              <button
                className="ml-2 text-xs border border-border rounded px-2 py-1 hover:border-primary hover:text-primary"
                onClick={() => { if (whatsLoja) navigator.clipboard.writeText(whatsLoja).then(() => show('Número da loja copiado', 'success')) }}
                disabled={!whatsLoja}
              >
                Copiar
              </button>
            </div>
          </div>
        </section>

        {/* Coluna direita: lista dos produtos e ação */}
        <section className="md:col-span-2 space-y-4">
          <div className="border border-border rounded-lg p-4 bg-surface">
            <h2 className="font-semibold mb-3">Seus produtos</h2>
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.productId} className="flex items-center gap-3 border border-border rounded-lg p-3">
                  <img src={it.image || '/sem-imagem.svg'} className="w-14 h-14 object-cover rounded border border-border" onError={(e) => (e.currentTarget.src = '/sem-imagem.svg')} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium line-clamp-1">{it.name}</div>
                    <div className="text-xs price-text">R$ {it.price.toFixed(2)}</div>
                  </div>
                  <div className="text-sm text-gray-400">{it.quantity}x</div>
                  <div className="w-24 text-right font-semibold price-text">R$ {(it.quantity * it.price).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4"><span>Total</span><span className="font-semibold price-text">R$ {total.toFixed(2)}</span></div>
            <div className="text-xs text-gray-400 mt-1">Entrega e condições serão combinadas pelo WhatsApp da loja.</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={handleFinish} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Finalizar no WhatsApp</button>
              <button className="border border-border px-4 py-2 rounded-md" onClick={() => clear()}>Limpar carrinho</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
