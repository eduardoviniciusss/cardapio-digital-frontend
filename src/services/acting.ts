// "Atuar como": o Administrador pode fazer tudo que a Cantina e o Responsável
// fazem. Para isso ele escolhe uma escola (Cantina) ou um responsável, e o
// frontend manda o header X-Act-As-User em todas as chamadas daquela área.
// A escolha fica salva no localStorage para sobreviver a um F5.

export const ACTING_HEADER = 'X-Act-As-User'

const SCHOOL_KEY = 'cardapio:acting-school'
const PARENT_KEY = 'cardapio:acting-parent'

export interface ActingSchool {
  id: number
  name: string
  /** Usuário da Cantina dona da escola: é em nome dele que o Admin atua */
  canteenUserId: number
}

export interface ActingParent {
  userId: number
  name: string
}

export type ActingScope = 'school' | 'parent' | null

// Páginas de gestão da escola (Categorias, Produtos, Cardápios)
const SCHOOL_PATHS = ['/categorias', '/produtos', '/cardapios', '/pedidos']

/** Descobre qual tipo de "atuar como" a tela atual precisa */
export function scopeForPath(pathname: string): ActingScope {
  if (pathname === '/filhos' || pathname.startsWith('/filhos/')) return 'parent'
  if (pathname === '/meus-pedidos') return 'parent'
  if (SCHOOL_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return 'school'
  return null
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  if (value === null) localStorage.removeItem(key)
  else localStorage.setItem(key, JSON.stringify(value))
}

export const getActingSchool = () => read<ActingSchool>(SCHOOL_KEY)
export const getActingParent = () => read<ActingParent>(PARENT_KEY)
export const setActingSchool = (school: ActingSchool | null) => write(SCHOOL_KEY, school)
export const setActingParent = (parent: ActingParent | null) => write(PARENT_KEY, parent)

/** Limpa tudo (chamado no login e no logout) */
export function clearActing() {
  localStorage.removeItem(SCHOOL_KEY)
  localStorage.removeItem(PARENT_KEY)
}

/** Id do usuário que o Admin está representando na tela atual (ou null) */
export function actingUserIdForPath(pathname: string): number | null {
  const scope = scopeForPath(pathname)
  if (scope === 'school') return getActingSchool()?.canteenUserId ?? null
  if (scope === 'parent') return getActingParent()?.userId ?? null
  return null
}
