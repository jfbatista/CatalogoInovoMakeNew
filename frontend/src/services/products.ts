import { api } from './api'
import type { Product } from '../types/product'

function normalizePreco(value: any): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const sanitized = value.replace(/\./g, '').replace(',', '.')
    const parsed = Number(sanitized)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function extractPreco(obj: any): number {
  const candidates = [
    obj?.Preco,
    obj?.preco,
    obj?.Valor,
    obj?.valor,
    obj?.PrecoVenda,
    obj?.precoVenda,
    obj?.Price,
    obj?.price
  ]
  for (const c of candidates) {
    const n = normalizePreco(c)
    if (n > 0) return n
  }
  // se nenhum candidato > 0, retorne o normalizado do primeiro mesmo assim
  return normalizePreco(candidates.find((c) => c !== undefined))
}

function extractImagemUrl(obj: any): string | undefined {
  return (
    obj?.ImagemUrl ||
    obj?.ImageUrl ||
    obj?.imagemUrl ||
    obj?.Foto ||
    obj?.foto ||
    undefined
  )
}

function normalizeProduct(p: any): Product {
  return {
    ...p,
    Preco: extractPreco(p),
    ImagemUrl: extractImagemUrl(p) ?? p?.ImagemUrl
  }
}

export const productsService = {
  getAll: async () => {
    const response = await api.get('/produtos')
    const data = response.data as Product[] | { items: Product[] }
    const items = Array.isArray(data) ? data : data.items
    return items.map(normalizeProduct)
  },

  getPageByCategory: async ({ categoriaId, limit, offset }: { categoriaId: string; limit: number; offset: number }) => {
    const response = await api.get(`/produtos/categoria/${categoriaId}`, { params: { limit, offset } })
    const data = response.data as { items?: any[]; total?: number; hasMore?: boolean } | any[]
    if (Array.isArray(data)) {
      const items = data.slice(offset, offset + limit).map(normalizeProduct)
      const total = data.length
      const hasMore = offset + items.length < total
      return { items, total, hasMore }
    }
    const items = (data.items ?? []).map(normalizeProduct)
    return { items, total: data.total ?? items.length, hasMore: Boolean(data.hasMore) }
  },

  getPage: async ({ limit, offset }: { limit: number; offset: number }) => {
    const response = await api.get('/produtos', { params: { limit, offset } })
    const data = response.data as { items?: any[]; total?: number; hasMore?: boolean } | any[]
    if (Array.isArray(data)) {
      // compat: backend sem paginação -> emular página única
      const items = data.slice(offset, offset + limit).map(normalizeProduct)
      const total = data.length
      const hasMore = offset + items.length < total
      return { items, total, hasMore }
    }
    const items = (data.items ?? []).map(normalizeProduct)
    return { items, total: data.total ?? items.length, hasMore: Boolean(data.hasMore) }
  },

  getById: async (id: string) => {
    const response = await api.get<Product>(`/produtos/${id}`)
    const p: any = response.data
    return { ...p, Preco: extractPreco(p), ImagemUrl: extractImagemUrl(p) ?? p?.ImagemUrl }
  },

  create: async (product: Omit<Product, 'id'>) => {
    const response = await api.post<Product>('/produtos', product)
    return response.data
  },
  update: async (id: string, product: Partial<Product>) => {
    const response = await api.put<Product>(`/produtos/${id}`, product)
    return response.data
  },

  delete: async (id: string) => {
    await api.delete(`/produtos/${id}`)
  }
}