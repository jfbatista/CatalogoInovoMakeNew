import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productsService } from '../services/products'
import { imagesService } from '../services/images'
import { useCart } from '../context/CartContext'
import { useState } from 'react'

export default function Product({ depositoId }: { depositoId: string | null }) {
  const { id } = useParams()
  const { add } = useCart()
  const navigate = useNavigate()
  const [selectedImg, setSelectedImg] = useState<string | null>(null)
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id, depositoId],
    queryFn: () => productsService.getById(id as string, depositoId),
    // aguardar o depositoId para já carregar com preço correto da loja
    enabled: !!id && depositoId !== null
  })
  const { data: imgs = [] } = useQuery({
    queryKey: ['product-images', id],
    queryFn: () => imagesService.getByProductId(id as string),
    enabled: !!id
  })

  if (isLoading || !product) return <div className="p-4">Carregando...</div>
  const defaultUrl = product.ImagemUrl || imgs[0]?.AWSLink || '/sem-imagem.svg'
  const mainUrl = selectedImg || defaultUrl

  const precoBase = Number((product as any).Preco ?? 0) || 0
  const isPromo = !!(product as any).EmPromocao && Number((product as any).PrecoPromocional ?? 0) > 0
  const precoMostrar = isPromo ? Number((product as any).PrecoPromocional) : precoBase

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <div className="mb-4">
        <button onClick={() => navigate('/')} className="text-sm text-primary hover:underline">← Voltar às compras</button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <img src={mainUrl} alt={product.Nome} className="w-full rounded-lg border border-border object-cover" onError={(e) => (e.currentTarget.src = '/sem-imagem.svg')} />
          {imgs.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {imgs.slice(0, 5).map((img) => {
                const active = (selectedImg || defaultUrl) === img.AWSLink
                return (
                  <button key={img.AWSLink} onClick={() => setSelectedImg(img.AWSLink || null)} className={`rounded border ${active ? 'border-primary' : 'border-border'} overflow-hidden`}> 
                    <img src={img.AWSLink} className="w-full h-20 object-cover" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">{product.Nome}</h1>
          <p className="text-sm text-gray-400 mb-4">Código: {product.Codigo}</p>

          {isPromo ? (
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-gray-400 line-through">R$ {precoBase.toFixed(2)}</span>
              <span className="text-2xl font-bold text-primary">R$ {precoMostrar.toFixed(2)}</span>
            </div>
          ) : (
            <div className="text-2xl font-bold text-primary mb-4">R$ {precoMostrar.toFixed(2)}</div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => add({ product: { ...(product as any), Preco: precoMostrar } as any, image: mainUrl, quantity: 1 })}
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
            >
              Adicionar ao carrinho
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
