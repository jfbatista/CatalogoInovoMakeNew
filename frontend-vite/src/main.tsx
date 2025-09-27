import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './components/ToastProvider'
import { CartUIProvider } from './components/CartUIContext'
import App from './App'
import './index.css'

const client = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <CartProvider>
          <ToastProvider>
            <CartUIProvider>
              <App />
            </CartUIProvider>
          </ToastProvider>
        </CartProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
