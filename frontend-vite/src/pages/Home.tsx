import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
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

  // calcular colunas responsivas (aproximação das classes tailwind)
  function computeCols() {
    const w = window.innerWidth
    if (w < 640) return 1 // grid-cols-1
    if (w < 1024) return 2 // sm:grid-cols-2
    if (w < 1280) return 3 // lg:grid-cols-3
    return 4 // xl:grid-cols-4
  }
  const [cols, setCols] = useState<number>(typeof window !== 'undefined' ? computeCols() : 4)
  useEffect(() => {
    const onResize = () => setCols(computeCols())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // transformar em linhas para virtualização por linhas
  const rows = useMemo(() => {
    const out: Product[][] = []
    for (let i = 0; i < products.length; i += cols) out.push(products.slice(i, i + cols))
    return out
  }, [products, cols])

  // virtualização por janela (window scrolling)
  // Ajuste de altura por coluna para evitar sobreposição de cards (nome/preço variam a altura)
  const computeRowHeight = (c: number) => (c <= 1 ? 420 : 380)
  const [rowHeight, setRowHeight] = useState<number>(computeRowHeight(cols))
  useEffect(() => { setRowHeight(computeRowHeight(cols)) }, [cols])
  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => rowHeight,
    overscan: 6
  })

  // B) Prefetch: auto carregar próxima página quando nos aproximamos do fim
  useEffect(() => {
    if (!hasNextPage || rows.length === 0) return
    const vitems = virtualizer.getVirtualItems()
    const last = vitems[vitems.length - 1]
    if (!last) return
    const nearEnd = last.index >= rows.length - 3
    if (nearEnd && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [virtualizer.getVirtualItems(), rows.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  // B) Prefetch de imagens dos próximos itens
  useEffect(() => {
    const vitems = virtualizer.getVirtualItems()
    if (!vitems?.length) return
    const last = vitems[vitems.length - 1]?.index ?? 0
    const nextRows = rows.slice(last + 1, last + 3)
    const urls: string[] = []
    nextRows.flat().forEach((p) => {
      const url = (p as any).ImagemUrl
      if (url) urls.push(url)
    })
    urls.forEach((src) => { const img = new Image(); img.decoding = 'async'; img.src = src })
  }, [virtualizer.getVirtualItems(), rows])

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
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualizer.getVirtualItems().map((vi) => (
                <div key={vi.key} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vi.start}px)` }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {rows[vi.index]?.map((p) => (
                      <ProductCard key={p._id} product={p} />
                    ))}
                  </div>
                </div>
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
