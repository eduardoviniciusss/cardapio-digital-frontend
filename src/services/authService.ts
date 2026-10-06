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
 * - em ambiente de desenvolvimento sem tratamento de exceção: o STACK TRACE
 *   inteiro da exceção como corpo da resposta (isso é feio e não deve
 *   NUNCA ser mostrado direto para quem está usando o sistema)
 *
 * Esta função tenta extrair uma mensagem legível independentemente do
 * formato, e filtra qualquer coisa que pareça um despejo de exceção do
 * .NET em vez de uma mensagem de erro de verdade.
 */
function looksLikeRawException(text: string): boolean {
  return (
    text.length > 300 ||
    /Exception|StackTrace| at System\.| at Microsoft\.| at Npgsql\./.test(text)
  )
}

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data
    const rawText = typeof data === 'string' ? data : JSON.stringify(data ?? '')

    // Violação de restrição única (ex: usuário só pode ter 1 escola/1 pai) —
    // detectamos pelo texto do erro do Postgres/EF Core, mesmo que venha
    // dentro de um stack trace, e damos uma mensagem específica e útil.
    if (/duplicate key value violates unique constraint/i.test(rawText)) {
      return 'Este cadastro já existe e não pode ser duplicado (por exemplo, este usuário já possui um registro deste tipo vinculado a ele).'
    }

    if (typeof data === 'string' && data.trim().length > 0 && !looksLikeRawException(data)) {
      return data
    }

    if (data?.errors && typeof data.errors === 'object') {
      const firstField = Object.values(data.errors)[0]
      if (Array.isArray(firstField) && firstField.length > 0) {
        return String(firstField[0])
      }
    }

    if (typeof data?.title === 'string' && !looksLikeRawException(data.title)) {
      return data.title
    }

    if (typeof data?.message === 'string' && !looksLikeRawException(data.message)) {
      return data.message
    }

    if (error.response?.status === 401) {
      return 'E-mail ou senha inválidos.'
    }

    if (error.response?.status === 500) {
      return 'Ocorreu um erro inesperado no servidor. Tente novamente em instantes.'
    }

    if (error.code === 'ERR_NETWORK') {
      return 'Não foi possível conectar à API. Se estiver testando localmente, confirme que o backend está rodando; se for o servidor do Render, ele pode estar "dormindo" — aguarde alguns segundos e tente novamente.'
    }
  }

  return fallback
}