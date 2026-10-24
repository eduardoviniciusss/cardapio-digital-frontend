// Serviço de pedidos (agendamento de lanche).
// Fala com POST /orders do backend (OrderEndpoints.cs).

import api from '@/services/api';
import type { OrderPayload } from '@/types/order';

/** Confirma o agendamento do lanche de um filho */
export async function createOrder(data: OrderPayload): Promise<void> {
  await api.post('/orders', data);
}
