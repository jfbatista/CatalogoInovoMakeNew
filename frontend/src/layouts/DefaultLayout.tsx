import { ReactNode } from 'react'
import { Navbar } from '../components/Navbar'

interface DefaultLayoutProps {
  children: ReactNode
}

export function DefaultLayout({ children }: DefaultLayoutProps) {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Navbar />
      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}