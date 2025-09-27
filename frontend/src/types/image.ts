export interface Image {
  _id: string
  NomeArquivo?: string
  DataUpload?: string
  TipoArquivo?: string
  Arquivo?: string | null
  AWSLink?: string | null
  ReferenciaID?: string
  PalavrasChaves?: string | null
  AnexarEmail?: boolean
  Image?: string | null
  Description?: string | null
}
