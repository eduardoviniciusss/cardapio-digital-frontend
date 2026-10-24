// Serviço de categorias (exclusivo da Cantina).
// O backend descobre a escola pelo token, então não mandamos schoolId na consulta.
// GET /categories responde 404 ("School not found.") se a Cantina ainda não tem escola.

import api from '@/services/api'
import type { Category, CategoryPayload } from '@/types/category'

/** Lista as categorias da escola do usuário logado */
export async function getCategories(): Promise<Category[]> {
  const response = await api.get<Category[]>('/categories')
  return response.data
}

/** Cria uma categoria */
export async function createCategory(data: CategoryPayload): Promise<Category> {
  const response = await api.post<Category>('/categories', data)
  return response.data
}

/** Atualiza o nome de uma categoria */
export async function updateCategory(id: number, data: CategoryPayload): Promise<Category> {
  const response = await api.put<Category>(`/categories/${id}`, data)
  return response.data
}

/** Exclui uma categoria */
export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`)
}
