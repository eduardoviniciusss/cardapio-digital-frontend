import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authService } from '@/services/authService'
import type { AuthUser, DecodedToken, LoginPayload } from '@/types/auth'

const TOKEN_KEY = 'cardapio:token'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// O ASP.NET Core Identity costuma emitir claims com nomes "longos"
// (URIs) em vez de "name"/"role" simples. Checamos os dois formatos.
const CLAIM_NAME = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
const CLAIM_EMAIL = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
const CLAIM_ROLE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
const CLAIM_NAMEID = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'

/**
 * Decodifica a "payload" de um JWT sem validar a assinatura.
 * Validar a assinatura é responsabilidade do backend; no frontend só
 * precisamos ler os dados (claims) para saber quem é o usuário e
 * quando o token expira.
 *
 * Importante: usamos TextDecoder (UTF-8) em vez de atob() puro, porque
 * atob() sozinho corrompe caracteres acentuados (ç, ã, é...) presentes
 * em nomes/e-mails dentro do token, fazendo o JSON.parse falhar.
 */
function decodeToken(token: string): DecodedToken | null {
  try {
    const payloadBase64Url = token.split('.')[1]
    const base64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const json = new TextDecoder('utf-8').decode(bytes)
    return JSON.parse(json) as DecodedToken
  } catch {
    return null
  }
}

function extractUser(decoded: DecodedToken | null): AuthUser {
  if (!decoded) return {}
  return {
    id: (decoded.sub ?? decoded[CLAIM_NAMEID]) as string | undefined,
    name: (decoded.name ?? decoded[CLAIM_NAME]) as string | undefined,
    email: (decoded.email ?? decoded[CLAIM_EMAIL]) as string | undefined,
    role: (decoded.role ?? decoded[CLAIM_ROLE]) as number | undefined,
  }
}

/**
 * Só consideramos o token expirado quando conseguimos decodificá-lo E ele
 * tem um campo "exp" no passado. Se não conseguirmos decodificar (token
 * num formato que não previmos) ou não houver "exp", confiamos no token:
 * ele acabou de ser emitido pelo próprio backend, e qualquer problema real
 * de validade será pego pela API na primeira chamada (respondendo 401,
 * que o interceptor do Axios já trata deslogando o usuário).
 */
function isTokenExpired(decoded: DecodedToken | null): boolean {
  if (!decoded?.exp) return false
  const nowInSeconds = Date.now() / 1000
  return decoded.exp < nowInSeconds
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  // Começa "true" porque, ao carregar a página, ainda precisamos checar
  // se já existe um token salvo do localStorage antes de decidir
  // se o usuário está autenticado ou não.
  const [isLoading, setIsLoading] = useState(true)

  // Salva a sessão sem checar expiração — usado logo após um login bem
  // sucedido, quando o token acabou de ser emitido pelo backend. Checar
  // "isTokenExpired" aqui seria redundante e arriscado: se o relógio do
  // computador do usuário estiver dessincronizado, um token válido por 1h
  // poderia parecer "expirado" na hora, derrubando o login sem motivo.
  const startSession = useCallback((newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
    setUser(extractUser(decodeToken(newToken)))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const login = useCallback(
    async (payload: LoginPayload) => {
      const { token: newToken } = await authService.login(payload)
      startSession(newToken)
    },
    [startSession]
  )

  // Ao montar o app: restaura a sessão a partir do localStorage, se existir.
  // Aqui SIM faz sentido checar expiração — é um token que pode ter sido
  // salvo há horas ou dias, então "isTokenExpired" evita reaproveitar um
  // token realmente vencido.
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    if (savedToken) {
      const decoded = decodeToken(savedToken)
      if (isTokenExpired(decoded)) {
        localStorage.removeItem(TOKEN_KEY)
      } else {
        setToken(savedToken)
        setUser(extractUser(decoded))
      }
    }
    setIsLoading(false)
  }, [])

  // Escuta o evento disparado pelo interceptor do Axios (api.ts) quando
  // a API responde 401, e desloga o usuário automaticamente.
  useEffect(() => {
    function handleUnauthorized() {
      logout()
    }
    window.addEventListener('cardapio:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('cardapio:unauthorized', handleUnauthorized)
  }, [logout])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth precisa ser usado dentro de um <AuthProvider>')
  }
  return context
}