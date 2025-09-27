import { api } from './api'
import type { Image } from '../types/image'

export const imagesService = {
  getByProductId: async (id: string, opts?: { limit?: number; fields?: string }) => {
    const response = await api.get<Image[]>(`/produtos/${id}/imagens`, {
      params: {
        limit: opts?.limit ?? 1,
        fields: opts?.fields ?? 'AWSLink'
      }
    })
    return response.data
  }
}
