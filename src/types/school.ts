export type ShiftName = 'Morning' | 'Afternoon' | 'Evening'

export const SHIFT_OPTIONS: { value: ShiftName; label: string }[] = [
  { value: 'Morning', label: 'Manhã' },
  { value: 'Afternoon', label: 'Tarde' },
  { value: 'Evening', label: 'Noite' },
]

// Corpo retornado por GET /schools, GET /schools/{id} e GET /schools/all
export interface School {
  id: number
  name: string
  address: string
  phone: string
  shifts: ShiftName[]
  // Só vem preenchido quando a listagem é a do Administrador (/schools/all),
  // que inclui quem é a Cantina dona de cada escola.
  canteenUserId?: number
  canteenName?: string
}

// Corpo enviado em POST /schools — só o Administrador cria, e precisa
// informar qual Cantina é a dona.
export interface CreateSchoolPayload {
  name: string
  address: string
  phone: string
  shifts: ShiftName[]
  canteenUserId: number
}

// Corpo enviado em PUT/PATCH /schools/{id} — o dono não muda na edição.
export interface UpdateSchoolPayload {
  name: string
  address: string
  phone: string
  shifts: ShiftName[]
}

// Retorno de GET /schools/available-canteens
export interface CanteenOption {
  id: number
  name: string
  email: string
}