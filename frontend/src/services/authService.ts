import axios from 'axios'
import { apiConfig } from '../config/apiConfig'

interface LoginResponse {
  success: boolean
  token: string | null
  email: string | null
  message: string
}

const api = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: 30000,
})

// Chaves para localStorage
const TOKEN_KEY = 'credits_auth_token'
const USER_KEY = 'credits_user_email'

/**
 * Realiza login com email @creditsbrasil.com.br
 */
export async function login(email: string): Promise<LoginResponse> {
  try {
    const response = await api.post<LoginResponse>('/auth/login', { email })
    
    if (response.data.success && response.data.token) {
      // Salva token e email no localStorage
      localStorage.setItem(TOKEN_KEY, response.data.token)
      localStorage.setItem(USER_KEY, response.data.email || email)
    }
    
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail
      if (detail) {
        throw new Error(detail)
      }
    }
    throw new Error('Erro ao fazer login. Tente novamente.')
  }
}

/**
 * Realiza logout
 */
export function logout(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

/**
 * Verifica se o usuário está logado
 */
export function isLoggedIn(): boolean {
  const token = localStorage.getItem(TOKEN_KEY)
  return token !== null && token.length > 0
}

/**
 * Retorna o token do usuário
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Retorna o email do usuário
 */
export function getUserEmail(): string | null {
  return localStorage.getItem(USER_KEY)
}
