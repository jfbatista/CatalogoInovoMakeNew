import { useInfiniteQuery } from '@tanstack/react-query'
import { productsService } from '../services/products'
import type { Product } from '../types'
import { ProductCard } from '../components/ProductCard'

export function Home({ categoryId, depositoId, search }: { categoryId: string | null; depositoId?: string | null; search?: string }) {
  const PAGE_SIZE = 24
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<{ items: Product[]; total: number; hasMore: boolean }>({
      queryKey: ['products', 'infinite', PAGE_SIZE, categoryId, depositoId, search],
      initialPageParam: 0,
      queryFn: ({ pageParam = 0 }) => {
        const offset = Number(pageParam) || 0
        if (categoryId) return productsService.getPageByCategory({ categoriaId: categoryId, limit: PAGE_SIZE, offset, depositoId: depositoId || undefined, search })
        return productsService.getPage({ limit: PAGE_SIZE, offset, depositoId: depositoId || undefined, search })
      },
      getNextPageParam: (lastPage, pages) => {
        if (!lastPage?.hasMore) return undefined
        return pages.length * PAGE_SIZE
      },
      refetchOnWindowFocus: false
    })

  const products: Product[] = data?.pages.flatMap((p) => p.items) ?? []

  return (
    <main className="p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Produtos</h1>
        <p className="text-gray-400">Navegue pelas categorias e encontre os melhores produtos.</p>
      </header>

      {isLoading && products.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-surface border border-border rounded-xl h-60" />
          ))}
        </div>
      ) : (
        <>
          {products.length === 0 ? (
            <div className="text-center text-gray-400 py-12 border border-border rounded-xl">Nenhum produto encontrado.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}

          {hasNextPage && (
            <div className="flex justify-center">
              <button
                className="mt-6 px-6 py-3 rounded-lg border border-border hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
