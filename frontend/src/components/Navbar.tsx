// import { useState } from 'react'
import { SearchBar } from './SearchBar'
import { CartButton } from './CartButton'
import { NotificationBell } from './NotificationBell'

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-surface/80 border-b border-border shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 justify-between items-center">
          <a 
            href="/" 
            className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent"
          >
            Catálogo
          </a>
          <div className="flex items-center gap-6">
            <div className="hidden md:block w-64">
              <SearchBar onSearch={console.log} />
            </div>
            <NotificationBell count={3} onClick={() => console.log('Notificações')} />
            <CartButton itemCount={2} onClick={() => console.log('Carrinho')} />
          </div>
        </div>
      </div>
    </nav>
  )
}