import { api } from './api'
import type { Category } from '../types/category'

export const categoriesService = {
  getAll: async () => {
    const response = await api.get<Category[]>('/categorias')
    return response.data
  }
}
