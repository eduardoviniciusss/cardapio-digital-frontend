// Tipos do agendamento de lanche.
// Espelham o OrderDto / OrderResponseDto do backend.

/** Dados enviados para agendar (POST /orders) */
export interface OrderPayload {
  childId: number;
  menuId: number;
  /** Data do agendamento em UTC ISO ("2026-10-12T00:00:00.000Z") */
  date: string;
  /** Produtos escolhidos (um por categoria) */
  productIds: number[];
}

/** Um produto dentro de um agendamento (nome e preço da época do pedido) */
export interface OrderItem {
  productId: number;
  name: string;
  category: string;
  price: number;
}

/** Agendamento devolvido pela API */
export interface Order {
  id: number;
  childId: number;
  childName: string;
  menuId: number;
  menuName: string;
  /** Dia do lanche ("2026-10-25T00:00:00", sem fuso) */
  date: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}