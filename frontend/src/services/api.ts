import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para tratamento de erros global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Erro do servidor (4xx, 5xx)
      console.error('Error response:', error.response.data)
      
      if (error.response.status === 401) {
        // Tratar erro de autenticação
      }
      
      if (error.response.status === 403) {
        // Tratar erro de autorização
      }
    } else if (error.request) {
      // Erro de conexão
      console.error('Error request:', error.request)
    } else {
      // Erro na configuração da requisição
      console.error('Error message:', error.message)
    }
    
    return Promise.reject(error)
  }
)

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)