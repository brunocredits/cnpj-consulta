import axios from 'axios'
import { apiConfig } from '../config/apiConfig'
import { getToken, logout } from './authService'

export interface ClienteInfo {
  cnpj: string
  razao_social: string
  responsavel: string
  status_conta: string
}

export interface ConsultaResult {
  encontrado: boolean
  cliente?: ClienteInfo
  mensagem?: string
}

const api = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: 30000,
})

export async function consultarCnpj(cnpj: string): Promise<ConsultaResult> {
  try {
    const token = getToken()
    
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    
    const response = await api.get<ConsultaResult>('/consulta', {
      params: { cnpj },
      headers,
    })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const detail = error.response?.data?.detail

      if (status === 401) {
        // Token expirado - faz logout
        logout()
        throw new Error('Sessão expirada. Faça login novamente.')
      }

      if (status === 403) {
        throw new Error('Acesso negado. Somente usuários @creditsbrasil.com.br podem acessar.')
      }

      if (status === 429) {
        throw new Error('Limite de requisições excedido. Aguarde alguns segundos e tente novamente.')
      }

      if (status === 503) {
        throw new Error('Serviço temporariamente indisponível. Tente novamente em alguns minutos.')
      }

      if (detail) {
        throw new Error(detail)
      }

      throw new Error('Erro ao consultar CNPJ. Verifique sua conexão e tente novamente.')
    }

    throw new Error('Erro inesperado. Tente novamente.')
  }
}
