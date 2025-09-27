import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api } from '../services/api'
import type { Product } from '../types/product'
import { imagesService } from '../services/images'

export function ProductDetails() {
  const { id } = useParams()

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.get(`/produtos/${id}`)
      return response.data as Product
    },
  })

  // Buscar imagens do produto (galeria) e usar a primeira como destaque
  const { data: imagens } = useQuery({
    queryKey: ['product-images', id],
    queryFn: () => imagesService.getByProductId(id as string),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 10,
  })

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="bg-[var(--color-border)] h-96 rounded-lg"></div>
        <div className="space-y-3 mt-4">
          <div className="h-8 bg-[var(--color-border)] rounded w-1/2"></div>
          <div className="h-4 bg-[var(--color-border)] rounded w-full"></div>
          <div className="h-4 bg-[var(--color-border)] rounded w-full"></div>
          <div className="h-4 bg-[var(--color-border)] rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (!product) {
    return <div className="text-text-secondary">Produto não encontrado</div>
  }

  const precoSeguro = typeof product.Preco === 'number' && !Number.isNaN(product.Preco)
    ? product.Preco
    : 0

  const highlightImage = product.ImagemUrl || (imagens && imagens[0]?.AWSLink) || '/placeholder-product.png'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <img
          src={highlightImage}
          alt={product.Nome}
          className="w-full rounded-lg object-cover"
          loading="lazy"
        />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-text">{product.Nome}</h1>
        <p className="mt-4 text-text-secondary">{product.Descricao}</p>
        <div className="mt-8">
          <span className="text-4xl font-bold text-primary">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(precoSeguro)}
          </span>
        </div>
        <button className="mt-8 w-full bg-primary text-white py-3 px-8 rounded-md hover:bg-primary-hover transition-colors">
          Adicionar ao Carrinho
        </button>
      </div>
    </div>
  )
}