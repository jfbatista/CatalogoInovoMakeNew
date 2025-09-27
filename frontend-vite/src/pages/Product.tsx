import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productsService } from '../services/products'
import { imagesService } from '../services/images'
import { useCart } from '../context/CartContext'
import { useEffect, useState } from 'react'

export default function Product({ depositoId }: { depositoId: string | null }) {
  const { id } = useParams()
  const { add } = useCart()
  const navigate = useNavigate()
  const [selectedImg, setSelectedImg] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
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

  // Skeleton de carregamento do detalhe
  if (isLoading || !product) return (
    <div className="p-4 md:p-6 max-w-5xl">
      <div className="mb-4">
        <div className="h-4 w-40 bg-surface animate-pulse rounded" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="w-full h-80 bg-surface animate-pulse rounded border border-border" />
          <div className="mt-3 grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-surface animate-pulse rounded border border-border" />
            ))}
          </div>
        </div>
        <div>
          <div className="h-7 w-80 bg-surface animate-pulse rounded mb-3" />
          <div className="h-4 w-32 bg-surface animate-pulse rounded mb-6" />
          <div className="h-8 w-44 bg-surface animate-pulse rounded mb-6" />
          <div className="h-10 w-56 bg-surface animate-pulse rounded" />
        </div>
      </div>
    </div>
  )
  const defaultUrl = product.ImagemUrl || imgs[0]?.AWSLink || '/sem-imagem.svg'
  const mainUrl = selectedImg || defaultUrl
  const images = [product.ImagemUrl, ...(imgs.map((i) => i.AWSLink).filter(Boolean))].filter(Boolean) as string[]

  const precoBase = Number((product as any).Preco ?? 0) || 0
  const isPromo = !!(product as any).EmPromocao && Number((product as any).PrecoPromocional ?? 0) > 0
  const precoMostrar = isPromo ? Number((product as any).PrecoPromocional) : precoBase

  return (
    <>
    <div className="p-4 md:p-6 max-w-5xl">
      <div className="mb-4">
        <button onClick={() => navigate('/')} className="text-sm text-primary hover:underline">← Voltar às compras</button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <button onClick={() => setLightboxOpen(true)} className="block w-full">
            <img src={mainUrl} alt={product.Nome} className="w-full rounded-lg border border-border object-cover" onError={(e) => (e.currentTarget.src = '/sem-imagem.svg')} />
          </button>
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
    {/* Lightbox com navegação */}
    {lightboxOpen && (
      <Lightbox images={images} initialIndex={Math.max(0, images.indexOf(mainUrl))} onClose={() => setLightboxOpen(false)} />
    )}
    </>
  )
}

function Lightbox({ images, initialIndex, onClose }: { images: string[]; initialIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState<number>(initialIndex)
  const src = images[index]
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, images.length])
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-2">
          <button className="px-3 py-1.5 bg-surface rounded-md border border-border hover:border-primary" onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}>←</button>
          <button className="px-3 py-1.5 bg-surface rounded-md border border-border hover:border-primary" onClick={onClose}>Fechar</button>
          <button className="px-3 py-1.5 bg-surface rounded-md border border-border hover:border-primary" onClick={() => setIndex((i) => (i + 1) % images.length)}>→</button>
        </div>
        <img src={src} className="w-full max-h-[80vh] object-contain rounded-md border border-border bg-surface" />
      </div>
    </div>
  )
}
