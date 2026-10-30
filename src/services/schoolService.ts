// Serviço de escolas: CRUD completo.

import api from '@/services/api'
import type {
  CreateSchoolRequest,
  School,
  UpdateSchoolRequest,
} from '@/types/school'

/** Retorna a escola da Cantina logada (objeto único, não lista) */
export async function getMySchool(): Promise<School> {
  const response = await api.get<School>('/schools')
  return response.data
}

/** Lista todas as escolas (Administrador) */
export async function getAllSchools(): Promise<School[]> {
  const response = await api.get<School[]>('/schools/all')
  return response.data
}

/** Cria uma nova escola (Administrador) */
export async function createSchool(data: CreateSchoolRequest): Promise<School> {
  const response = await api.post<School>('/schools', data)
  return response.data
}

/** Atualiza uma escola (Administrador) */
export async function updateSchool(id: number, data: UpdateSchoolRequest): Promise<void> {
  await api.put(`/schools/${id}`, data)
}

/** Exclui uma escola (Administrador) */
export async function deleteSchool(id: number): Promise<void> {
  await api.delete(`/schools/${id}`)
}