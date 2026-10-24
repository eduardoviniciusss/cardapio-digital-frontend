// Serviço de filhos: listagem, cadastro e cardápios.

import api from '@/services/api';
import type { Child, ChildPayload, ChildMenu } from '@/types/family';

/** Lista os filhos do responsável logado */
export async function getChildren(): Promise<Child[]> {
  const response = await api.get<Child[]>('/children');
  return response.data;
}

/** Cadastra um novo filho */
export async function createChild(data: ChildPayload): Promise<string> {
  const response = await api.post<string>('/children', data);
  return response.data;
}

/** Busca os cardápios (com produtos) da escola de um filho */
export async function getChildMenus(childId: number): Promise<ChildMenu[]> {
  const response = await api.get<ChildMenu[]>(`/children/${childId}/menus`);
  return response.data;
}
