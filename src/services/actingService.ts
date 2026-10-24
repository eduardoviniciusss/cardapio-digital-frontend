// Lista de responsáveis para o Administrador escolher (GET /parents/users)

import api from '@/services/api'

export interface ParentUser {
  userId: number
  name: string
  email: string
  /** false = a conta existe, mas o cadastro de responsável ainda não foi feito */
  hasRegistration: boolean
}

export async function getParentUsers(): Promise<ParentUser[]> {
  const response = await api.get<ParentUser[]>('/parents/users')
  return response.data
}
