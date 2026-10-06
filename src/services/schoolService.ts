import { AxiosError } from 'axios'
import api from './api'
import type { CanteenOption, CreateSchoolPayload, School, UpdateSchoolPayload } from '@/types/school'

/**
 * Serviço de Escolas.
 *
 * Modelo confirmado com o backend: cada escola pertence a UMA Cantina
 * (School.UserId aponta para o usuário Cantina). O Administrador não é
 * dono de nenhuma escola — ele gerencia todas através de /schools/all.
 */
export const schoolService = {
  /** GET /schools — a escola do usuário logado (uso da Cantina). */
  async getMine(): Promise<School | null> {
    try {
      const { data } = await api.get<School>('/schools')
      return data
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  /** GET /schools/all — todas as escolas (uso do Administrador). */
  async listAll(): Promise<School[]> {
    const { data } = await api.get<School[]>('/schools/all')
    return data
  },

  /** GET /schools/available-canteens — Cantinas ainda sem escola vinculada. */
  async availableCanteens(): Promise<CanteenOption[]> {
    const { data } = await api.get<CanteenOption[]>('/schools/available-canteens')
    return data
  },

  async create(payload: CreateSchoolPayload): Promise<School> {
    const { data } = await api.post<School>('/schools', payload)
    return data
  },

  async update(id: number, payload: UpdateSchoolPayload): Promise<School> {
    const { data } = await api.put<School>(`/schools/${id}`, payload)
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/schools/${id}`)
  },
}