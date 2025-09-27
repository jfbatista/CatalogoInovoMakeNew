import { api } from './api'

export interface Deposito {
  _id: string
  Nome?: string
  Descricao?: string
  DescricaoReduzida?: string
}

export const depositosService = {
  getAll: async (): Promise<Deposito[]> => {
    const { data } = await api.get<Deposito[]>('/depositos')
    return data
  },
  getWhatsapp: async (depositoId: string): Promise<string> => {
    const { data } = await api.get<{ numero: string }>(`/depositos/${depositoId}/whatsapp`)
    return data?.numero || '5561984498130'
  }
}
