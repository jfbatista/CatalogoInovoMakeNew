import { imagesService } from '../services/images'
import type { Product } from '../types'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

export function ProductCard({ product }: { product: Product }) {
  const { data } = useQuery({
    queryKey: ['img', product._id],
    queryFn: () => imagesService.getByProductId(product._id),
    enabled: !product.ImagemUrl
  })
  const fetched = data && data[0]?.AWSLink
  const fallback = '/sem-imagem.svg'
  const src = product.ImagemUrl || fetched || fallback

  const isPromo = (product.EmPromocao && (product.PrecoPromocional ?? 0) > 0) ||
    (product.PrecoPromocional !== undefined && product.PrecoPromocional < product.Preco)
  const precoAtual = isPromo ? (product.PrecoPromocional as number) : product.Preco

  return (
    <Link to={`/produto/${product._id}`} className="group block relative rounded-xl overflow-hidden border border-border bg-surface transition-colors hover:border-primary">
      {/* Shine */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

      {/* Badge Promo */}
      {isPromo && (
        <span className="absolute left-2 top-2 z-[1] bg-primary text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow">
          Promoção
        </span>
      )}

      <div className="aspect-[4/3] bg-surface relative">
        <img
          src={src}
          alt={product.Nome}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => (e.currentTarget.src = fallback)}
        />
      </div>
      <div className="p-3">
        <h3 className="font-semibold line-clamp-2 mb-1">{product.Nome}</h3>
        {isPromo ? (
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-gray-400 line-through">R$ {product.Preco.toFixed(2)}</span>
            <span className="text-sm font-semibold text-primary">R$ {precoAtual.toFixed(2)}</span>
          </div>
        ) : (
          <div className="text-sm text-gray-300">R$ {precoAtual.toFixed(2)}</div>
        )}
      </div>
    </Link>
  )
}
