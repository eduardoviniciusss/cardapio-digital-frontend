// Serviço de escolas: CRUD completo.

import api from '@/services/api';
import type {
  AvailableCanteen,
  CreateSchoolRequest,
  School,
  SchoolOption,
  UpdateSchoolRequest,
} from '@/types/school';

/** Retorna a escola da Cantina logada (objeto único, não lista) */
export async function getMySchool(): Promise<School> {
  const response = await api.get<School>('/schools');
  return response.data;
}

/** Lista todas as escolas (só para Administrador) */
export async function getAllSchools(): Promise<School[]> {
  const response = await api.get<School[]>('/schools/all');
  return response.data;
}

/** Lista Cantinas disponíveis (sem escola vinculada) */
export async function getAvailableCanteens(): Promise<AvailableCanteen[]> {
  const response = await api.get<AvailableCanteen[]>('/schools/available-canteens');
  return response.data;
}

/** Cria uma nova escola (só Administrador) */
export async function createSchool(data: CreateSchoolRequest): Promise<School> {
  const response = await api.post<School>('/schools', data);
  return response.data;
}

/** Atualiza uma escola (só Administrador) */
export async function updateSchool(id: number, data: UpdateSchoolRequest): Promise<void> {
  await api.put(`/schools/${id}`, data);
}

/** Exclui uma escola (só Administrador) */
export async function deleteSchool(id: number): Promise<void> {
  await api.delete(`/schools/${id}`);
}

/** Lista opções de escola para o Responsável (GET /schools/options) */
export async function getSchoolOptions(): Promise<SchoolOption[]> {
  const response = await api.get<SchoolOption[]>('/schools/options');
  return response.data;
}