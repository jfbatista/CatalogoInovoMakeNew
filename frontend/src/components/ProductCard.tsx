import type { Product } from '../types/product'
import { useQuery } from '@tanstack/react-query'
import { imagesService } from '../services/images'
import { useInView } from '../hooks/useInView'
interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const preco = typeof product.Preco === 'number' && !Number.isNaN(product.Preco)
    ? product.Preco
    : Number(product.Preco) || 0

  const precoOriginal = preco > 0 ? preco * 1.2 : 0

  // Apenas quando o card entra no viewport
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin: '200px' })

  // Busca primeira imagem via endpoint quando ImagemUrl não existe e o card está visível
  const { data: imgs } = useQuery({
    queryKey: ['product-images', product._id],
    queryFn: () => imagesService.getByProductId(product._id),
    enabled: inView && !product.ImagemUrl && Boolean(product._id),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const fetchedImage = imgs && imgs.length > 0 ? imgs[0].AWSLink ?? undefined : undefined
  const imageSrc = product.ImagemUrl || fetchedImage || '/placeholder-product.png'

  return (
    <div ref={ref} className="group relative bg-surface rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="relative">
        <div className="w-full aspect-[4/3] bg-[var(--color-surface)]">
          {inView ? (
            <img 
              src={imageSrc} 
              alt={product.Nome}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
              decoding="async"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-product.png' }}
            />
          ) : (
            <div className="w-full h-full animate-pulse bg-[var(--color-border)]" />
          )}
        </div>
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary ring-1 ring-primary/20">
            Promoção
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-text mb-2 group-hover:text-primary transition-colors">
          {product.Nome}
        </h3>
        <p className="text-sm text-text-secondary line-clamp-2 mb-4">
          {product.Descricao}
        </p>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {preco > 0 && (
              <p className="text-xs text-text-secondary line-through opacity-75">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(precoOriginal)}
              </p>
            )}
            {preco > 0 ? (
              <p className="text-xl font-bold text-primary">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(preco)}
              </p>
            ) : (
              <p className="text-sm font-medium text-text-secondary">Sob consulta</p>
            )}
          </div>
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-hover transition-all duration-300 transform hover:scale-105 shadow-glow hover:shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
            Adicionar
          </button>
        </div>
      </div>
    </div>
  )
}