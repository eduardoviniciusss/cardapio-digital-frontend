import api from './api'
import type { Category, CategoryPayload } from '@/types/category'

/**
 * Serviço de Categorias — segue o mesmo padrão de authService.ts /
 * schoolService.ts. Confirmado lendo CategoryEndpoints.cs do backend:
 *
 * - GET /categories retorna a lista de categorias DA ESCOLA DO USUÁRIO
 *   LOGADO (o backend descobre a escola pelo token, não precisamos mandar
 *   schoolId na consulta). Se o usuário ainda não tiver escola cadastrada,
 *   a API responde 404 ("School not found.") — trate isso como "usuário
 *   precisa cadastrar uma escola antes", não como uma lista vazia comum.
 * - POST/PUT exigem { name, schoolId } no corpo.
 * - Todas as rotas exigem o papel "Canteen".
 */
export const categoryService = {
  async list(): Promise<Category[]> {
    const { data } = await api.get<Category[]>('/categories')
    return data
  },

  async create(payload: CategoryPayload): Promise<Category> {
    const { data } = await api.post<Category>('/categories', payload)
    return data
  },

  async update(id: number, payload: CategoryPayload): Promise<Category> {
    const { data } = await api.put<Category>(`/categories/${id}`, payload)
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/categories/${id}`)
  },
}