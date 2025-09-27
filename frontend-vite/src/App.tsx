import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Home } from './pages/Home'
import { Header } from './components/Header'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'

export default function App() {
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [depositoId, setDepositoId] = useState<string | null>(null)
  const [search, setSearch] = useState<string>('')
  const navigate = useNavigate()
  return (
    <div className="min-h-screen">
      {/* Sidebar fixa em desktop */}
      <Sidebar selected={categoryId} onSelect={(id) => { setCategoryId(id); navigate('/') }} />
      {/* Conteúdo deslocado para a direita no desktop para não ficar sob a sidebar fixa */}
      <div className="md:ml-72">
        <Header selectedDepositoId={depositoId} onChangeDeposito={setDepositoId} search={search} onChangeSearch={setSearch} />
        <Routes>
          <Route path="/" element={<Home categoryId={categoryId} depositoId={depositoId} search={search} />} />
          <Route path="/produto/:id" element={<Product depositoId={depositoId} />} />
          <Route path="/carrinho" element={<Cart />} />
          <Route path="/checkout" element={<Checkout depositoId={depositoId} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}
