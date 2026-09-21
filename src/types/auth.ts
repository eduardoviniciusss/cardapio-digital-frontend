/**
 * Papéis (roles) de usuário do sistema.
 *
 * O backend recebe "role" como número no cadastro (POST /users).
 * O Swagger do projeto mostra o campo, mas não documenta o significado de
 * cada valor — ajuste os números abaixo caso o backend use uma ordem
 * diferente (confira em /schools, /parents, /children ou peça ao time de
 * backend a listagem oficial do enum).
 */
export enum UserRole {
  Administrator = 1,
  Canteen = 2,
  Parent = 3,
}

export const roleLabels: Record<UserRole, string> = {
  [UserRole.Administrator]: 'Administrador',
  [UserRole.Canteen]: 'Cantina',
  [UserRole.Parent]: 'Responsável',
}

// Corpo enviado em POST /users
export interface RegisterPayload {
  name: string
  email: string
  password: string
  role: UserRole
}

// Resposta de POST /users
export interface RegisterResponse {
  id: number
  name: string
  email: string
}

// Corpo enviado em POST /login
export interface LoginPayload {
  email: string
  password: string
}

// Resposta de POST /login
export interface LoginResponse {
  token: string
}

// Formato decodificado do JWT (ajuste conforme os "claims" reais do token)
export interface DecodedToken {
  sub?: string
  email?: string
  name?: string
  role?: number
  exp: number
  [key: string]: unknown
}

// Usuário autenticado guardado no contexto
export interface AuthUser {
  id?: string
  name?: string
  email?: string
  role?: number
}
