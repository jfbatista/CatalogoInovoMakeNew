import { api } from './api'
import type { Category } from '../types'

export const categoriesService = {
  getAll: async (): Promise<Category[]> => {
    const { data } = await api.get<Category[]>('/categorias')
    return data
  }
}
