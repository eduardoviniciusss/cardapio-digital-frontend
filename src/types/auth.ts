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

/**
 * O valor de "role" dentro do JWT pode chegar em formatos diferentes
 * dependendo de como o ASP.NET Core serializa o claim:
 * - número: 1
 * - texto numérico: "1"  <- o mais comum, pois Claim.Value é sempre string
 * - nome do papel: "Administrator"
 *
 * Esta função normaliza qualquer um desses formatos para o enum UserRole,
 * evitando bugs de comparação como "1" === 1 (que é false em JS).
 */
const ROLE_NAME_MAP: Record<string, UserRole> = {
  administrator: UserRole.Administrator,
  admin: UserRole.Administrator,
  canteen: UserRole.Canteen,
  parent: UserRole.Parent,
}

export function normalizeRole(raw: unknown): UserRole | undefined {
  if (raw === null || raw === undefined) return undefined

  if (typeof raw === 'number') {
    return raw in roleLabels ? (raw as UserRole) : undefined
  }

  if (typeof raw === 'string') {
    const asNumber = Number(raw)
    if (!Number.isNaN(asNumber) && asNumber in roleLabels) {
      return asNumber as UserRole
    }
    return ROLE_NAME_MAP[raw.toLowerCase()]
  }

  return undefined
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