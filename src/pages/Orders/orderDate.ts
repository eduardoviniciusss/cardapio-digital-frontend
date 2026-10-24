// A API devolve a data do pedido sem fuso ("2026-10-25T00:00:00").
// Usamos só os 10 primeiros caracteres (AAAA-MM-DD) para nunca mostrar um dia a menos.

import { formatDate } from '@/utils/format';

/** "2026-10-25T00:00:00" -> "2026-10-25" */
export function orderDay(isoDate: string): string {
  return isoDate.slice(0, 10);
}

/** "2026-10-25T00:00:00" -> "25/10/2026" */
export function formatOrderDate(isoDate: string): string {
  return formatDate(`${orderDay(isoDate)}T00:00:00Z`);
}
