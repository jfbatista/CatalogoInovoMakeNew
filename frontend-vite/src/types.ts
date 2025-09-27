export interface Product {
  _id: string
  Codigo: string
  Nome: string
  Descricao?: string
  Preco: number
  PrecoPromocional?: number
  EmPromocao?: boolean
  ImagemUrl?: string
}

export interface Category {
  _id: string
  Nome: string
}

export interface Image { AWSLink?: string }
