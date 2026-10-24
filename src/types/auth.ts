// Tipos do módulo de autenticação

/**
 * Papéis do sistema. No token JWT o papel vem como TEXTO
 * ("Administrator", "Canteen", "Parent"), por isso usamos strings aqui.
 */
export const UserRole = {
  Administrator: 'Administrator',
  Canteen: 'Canteen',
  Parent: 'Parent',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

/** Rótulos em português para exibir cada papel na tela */
export const roleLabels: Record<UserRole, string> = {
  Administrator: 'Administrador',
  Canteen: 'Cantina',
  Parent: 'Responsável',
}

export interface User {
  id: number
  name: string
  email: string
  role: string
}

export interface LoginRequest {
  email: string
  password: string
}

// O backend devolve { token, user: { id, name, email, role } }
// user pode não vir em respostas parciais
export interface LoginResponse {
  token: string
  user?: {
    id: number
    name: string
    email: string
    role: string | number
  }
}

// No cadastro o front envia o papel como NÚMERO: 1 = Administrator, 2 = Canteen, 3 = Parent
export interface RegisterRequest {
  name: string
  email: string
  password: string
  role: number
}

// RegisterResponse removido: o backend responde com texto simples

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}
