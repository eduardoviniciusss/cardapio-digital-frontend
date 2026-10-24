// Tipos do agendamento de lanche feito pelo responsável.
// Espelha o OrderDto do backend (POST /orders).

export interface OrderPayload {
  childId: number;
  menuId: number;
  /** Data do agendamento em UTC ISO ("2026-10-12T00:00:00.000Z") */
  date: string;
  /** Produtos escolhidos (um por categoria) */
  productIds: number[];
}
