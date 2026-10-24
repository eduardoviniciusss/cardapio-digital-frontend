// Funções de formatação de valores

/** Formata um valor numérico como moeda brasileira (R$) */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Formata uma data ISO em pt-BR, usando timeZone UTC
 * para não mostrar um dia a menos por fuso horário.
 */
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
  });
}

/**
 * Converte o valor de um <input type="date"> ("2015-04-20")
 * para uma data UTC ISO completa ("2015-04-20T00:00:00.000Z").
 * O PostgreSQL (Npgsql) exige UTC.
 */
export function dateInputToUtcIso(dateValue: string): string {
  return `${dateValue}T00:00:00.000Z`;
}

/** Retorna a data de hoje no formato "YYYY-MM-DD" para usar como max de input date */
export function todayInputValue(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
