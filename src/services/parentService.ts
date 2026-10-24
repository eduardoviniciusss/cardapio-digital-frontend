// Serviço do responsável: cadastro do responsável.

import api from '@/services/api';
import type { Parent, ParentPayload } from '@/types/family';

/** Completa o cadastro de responsável (POST /parents) */
export async function createParent(data: ParentPayload): Promise<Parent> {
  const response = await api.post<Parent>('/parents', data);
  return response.data;
}
