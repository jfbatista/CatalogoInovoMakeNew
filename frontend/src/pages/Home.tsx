import { useInfiniteQuery } from '@tanstack/react-query'
import { useState } from 'react'
import type { Product } from '../types/product'
import { productsService } from '../services/products'
import { ProductCard } from '../components/ProductCard'
import { CategorySidebar } from '../components/CategorySidebar'

export function Home() {
  const PAGE_SIZE = 24
  const [categoriaId, setCategoriaId] = useState<string | null>(null)

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<{ items: Product[]; total: number; hasMore: boolean }>({
      queryKey: ['products', 'infinite', PAGE_SIZE, categoriaId],
      initialPageParam: 0,
      queryFn: ({ pageParam = 0 }) => {
        const offset = Number(pageParam) || 0
        if (categoriaId) {
          return productsService.getPageByCategory({ categoriaId, limit: PAGE_SIZE, offset })
        }
        return productsService.getPage({ limit: PAGE_SIZE, offset })
      },
      getNextPageParam: (lastPage, pages) => {
        if (!lastPage?.hasMore) return undefined
        return pages.length * PAGE_SIZE
      },
      refetchOnWindowFocus: false
    })

  const products: Product[] = data?.pages.flatMap((p) => p.items) ?? []

  return (
    <div className="container mx-auto px-4 pt-6 md:pt-8">
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 hidden md:block">
          <CategorySidebar selected={categoriaId} onSelect={setCategoriaId} />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col gap-8">
          {/* Header Section (sem elementos decorativos exagerados) */}
          <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-md)] p-6 md:p-8">
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] bg-clip-text text-transparent mb-3 md:mb-4">
              Produtos em Destaque
            </h1>
            <p className="text-[var(--color-text-secondary)] max-w-2xl text-sm md:text-base">
              Encontre os melhores produtos com os melhores preços. Atualizamos nossa lista diariamente com novos produtos e ofertas imperdíveis.
            </p>
          </div>

          {/* Sidebar controla a filtragem por categoria; nenhum menu no topo */}

          {/* Products Grid */}
          {isLoading && products.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="animate-pulse bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]">
                  <div className="bg-[var(--color-border)] h-56 rounded-xl"></div>
                  <div className="space-y-3 mt-4">
                    <div className="h-4 bg-[var(--color-border)] rounded-full w-3/4"></div>
                    <div className="h-4 bg-[var(--color-border)] rounded-full"></div>
                    <div className="h-4 bg-[var(--color-border)] rounded-full w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {(!products || products.length === 0) ? (
                <div className="text-center text-text-secondary py-12 border border-[var(--color-border)] rounded-xl">
                  Nenhum produto encontrado.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              )}
              {/* Load more */}
              {hasNextPage && (
                <div className="flex justify-center">
                  <button
                    className="mt-4 px-6 py-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-50"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}