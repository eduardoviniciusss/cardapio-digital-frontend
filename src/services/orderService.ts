// Serviço de pedidos (agendamento de lanche).
// Fala com os endpoints /orders do backend (OrderEndpoints.cs).

import api from '@/services/api';
import type { Order, OrderPayload } from '@/types/order';

/** Confirma o agendamento do lanche de um filho (POST /orders) */
export async function createOrder(data: OrderPayload): Promise<void> {
  await api.post('/orders', data);
}

/** Pedidos do responsável logado (GET /orders) */
export async function getMyOrders(): Promise<Order[]> {
  const response = await api.get<Order[]>('/orders');
  return response.data;
}

/** Cancela um agendamento do responsável (DELETE /orders/{id}) */
export async function cancelOrder(id: number): Promise<void> {
  await api.delete(`/orders/${id}`);
}

/**
 * Pedidos dos alunos da escola da Cantina (GET /orders/school).
 * Se "date" for informada ("2026-10-25"), traz só aquele dia.
 */
export async function getSchoolOrders(date?: string): Promise<Order[]> {
  const response = await api.get<Order[]>('/orders/school', {
    params: date ? { date } : undefined,
  });
  return response.data;
}
