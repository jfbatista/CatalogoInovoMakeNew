import { Route, Routes } from 'react-router-dom'
import { Home } from './pages/Home'
import { ProductDetails } from './pages/ProductDetails'

export function Router() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/product/:id" element={<ProductDetails />} />
    </Routes>
  )
}