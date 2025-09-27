import { api } from './api'
import type { Image } from '../types'

export const imagesService = {
  getByProductId: async (id: string) => {
    const { data } = await api.get<Image[]>(`/produtos/${id}/imagens`, {
      params: { limit: 1, fields: 'AWSLink' }
    })
    return data
  }
}
