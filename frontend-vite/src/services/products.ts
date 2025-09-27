import { api } from './api'
import type { Product } from '../types'

const normalize = (p: any): Product => ({
  ...p,
  // considerar várias possibilidades para preço vindas do backend
  Preco: Number(p?.Preco ?? p?.PrecoVenda ?? p?.Valor ?? p?.ValorMinimo ?? 0) || 0,
  ImagemUrl: p?.ImagemUrl ?? p?.ImageUrl ?? p?.Foto
})

export const productsService = {
  getPage: async ({ limit, offset, depositoId, search }: { limit: number; offset: number; depositoId?: string; search?: string }) => {
    const { data } = await api.get('/produtos', { params: { limit, offset, depositoId, search } })
    if (Array.isArray(data)) {
      const items = data.slice(offset, offset + limit).map(normalize)
      return { items, total: data.length, hasMore: offset + items.length < data.length }
    }
    return { items: (data.items ?? []).map(normalize), total: data.total ?? 0, hasMore: !!data.hasMore }
  },
  getPageByCategory: async ({ categoriaId, limit, offset, depositoId, search }: { categoriaId: string; limit: number; offset: number; depositoId?: string; search?: string }) => {
    const { data } = await api.get(`/produtos/categoria/${categoriaId}`, { params: { limit, offset, depositoId, search } })
    if (Array.isArray(data)) {
      const items = data.slice(offset, offset + limit).map(normalize)
      return { items, total: data.length, hasMore: offset + items.length < data.length }
    }
    return { items: (data.items ?? []).map(normalize), total: data.total ?? 0, hasMore: !!data.hasMore }
  },
  getById: async (id: string, depositoId?: string | null): Promise<Product> => {
    const { data } = await api.get(`/produtos/${id}`, { params: { depositoId: depositoId || undefined } })
    return normalize(data)
  }
}
