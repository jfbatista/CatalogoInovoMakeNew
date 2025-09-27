import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { depositosService, type Deposito } from '../services/depositos'
import { useTheme } from '../hooks/useTheme'
import { useCart } from '../context/CartContext'
import { useToast } from './ToastProvider'
import { useCartUI } from './CartUIContext'
import { useNavigate } from 'react-router-dom'

interface Props {
  selectedDepositoId: string | null
  onChangeDeposito: (id: string | null) => void
  search: string
  onChangeSearch: (v: string) => void
}

export function Header({ selectedDepositoId, onChangeDeposito, search, onChangeSearch }: Props) {
  const { theme, setTheme } = useTheme()
  const { count } = useCart()
  const { show } = useToast()
  const { openDrawer } = useCartUI()
  const [badgePulse, setBadgePulse] = useState(false)
  const navigate = useNavigate()
  const [inputValue, setInputValue] = useState<string>(search)
  const [typing, setTyping] = useState<boolean>(false)
  const { data: depositos = [], isLoading } = useQuery<Deposito[]>({
    queryKey: ['depositos'],
    queryFn: depositosService.getAll,
    staleTime: 1000 * 60 * 10
  })

  // definir depósito padrão como o primeiro do endpoint
  useEffect(() => {
    if (!selectedDepositoId && depositos.length > 0) {
      onChangeDeposito(depositos[0]._id)
    }
  }, [selectedDepositoId, depositos, onChangeDeposito])

  // manter input sincronizado com valor externo
  useEffect(() => {
    setInputValue(search)
  }, [search])

  // debounce da busca (300ms)
  useEffect(() => {
    setTyping(true)
    const t = setTimeout(() => {
      onChangeSearch(inputValue)
      setTyping(false)
    }, 300)
    return () => clearTimeout(t)
  }, [inputValue, onChangeSearch])

  // micro animação no badge quando o count muda
  useEffect(() => {
    if (count > 0) {
      setBadgePulse(true)
      const t = setTimeout(() => setBadgePulse(false), 400)
      return () => clearTimeout(t)
    }
  }, [count])

  return (
    <header className="sticky top-0 z-10 bg-surface/90 backdrop-blur border-b border-border">
      <div className="px-4 md:px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={'/logo-inove-make.jpg'}
            alt="Inove Make"
            className="h-8 w-auto"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement
              // tenta png e depois svg como fallback
              if (img.src.includes('logo-inove-make.jpg')) {
                img.src = '/logo-inove-make.png'
              } else if (img.src.includes('logo-inove-make.png')) {
                img.src = '/logo-inove-make.svg'
              }
            }}
          />
          <span className="hidden sm:block font-semibold text-primary">Inove Make</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-2xl">
          <label htmlFor="search" className="sr-only">Buscar</label>
          <div className="relative">
            <input
              id="search"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Buscar produtos..."
              className="w-full bg-surface border border-border rounded-md pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M10 2a8 8 0 105.293 14.293l4.707 4.707a1 1 0 001.414-1.414l-4.707-4.707A8 8 0 0010 2zm-6 8a6 6 0 1110.392 4.243A6 6 0 014 10z" clipRule="evenodd"/></svg>
            {typing && (
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            aria-label="Alternar tema"
            className="rounded-md border border-border px-3 py-2 text-sm hover:border-primary hover:text-primary transition-colors"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
          >
            {theme === 'dark' ? 'Claro' : 'Escuro'}
          </button>
          <label htmlFor="deposito" className="text-sm text-gray-400">Loja</label>
          <select
            id="deposito"
            className="bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={selectedDepositoId ?? ''}
            onChange={(e) => onChangeDeposito(e.target.value || null)}
            disabled={isLoading}
          >
            {depositos.map((d) => (
              <option key={d._id} value={d._id}>
                {d.DescricaoReduzida || d.Descricao || d.Nome || d._id}
              </option>
            ))}
          </select>

          {/* Cart icon */}
          <button title="Abrir carrinho" onClick={() => { show(`${count} item(s) no carrinho`); openDrawer() }} className="relative rounded-md border border-border px-3 py-2 text-sm hover:border-primary hover:text-primary transition-colors" aria-label="Carrinho">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.167 0 .313.112.355.273l2.394 8.977A2.25 2.25 0 008.56 14.25h7.44a2.25 2.25 0 002.17-1.65l1.323-4.97A.75.75 0 0018.78 6H6.525l-.5-1.875A2.25 2.25 0 003.636 2.25H2.25zM9 18a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm9 1.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
            </svg>
            <span className={`absolute -top-1 -right-1 bg-primary text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full ${badgePulse ? 'animate-ping-once' : ''}`}>{count}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
