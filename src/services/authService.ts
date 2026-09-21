import { AxiosError } from 'axios'
import api from './api'
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
} from '@/types/auth'

/**
 * Camada de autenticação: sabe conversar com os endpoints /login e /users,
 * mas não sabe nada sobre React, Context ou telas. Isso facilita testar
 * e reaproveitar essa lógica em qualquer lugar.
 */
export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/login', payload)
    return data
  },

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const { data } = await api.post<RegisterResponse>('/users', payload)
    return data
  },
}

/**
 * ASP.NET Core Minimal API costuma responder erros em formatos como:
 * - ProblemDetails: { title, status, errors: { Email: ["mensagem"] } }
 * - texto simples
 * Esta função tenta extrair uma mensagem legível independentemente do formato.
 */
export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data

    if (typeof data === 'string' && data.trim().length > 0) {
      return data
    }

    if (data?.errors && typeof data.errors === 'object') {
      const firstField = Object.values(data.errors)[0]
      if (Array.isArray(firstField) && firstField.length > 0) {
        return String(firstField[0])
      }
    }

    if (typeof data?.title === 'string') {
      return data.title
    }

    if (typeof data?.message === 'string') {
      return data.message
    }

    if (error.response?.status === 401) {
      return 'E-mail ou senha inválidos.'
    }

    if (error.code === 'ERR_NETWORK') {
      return 'Não foi possível conectar à API. O servidor no Render pode estar "dormindo" — aguarde alguns segundos e tente novamente.'
    }
  }

  return fallback
}
