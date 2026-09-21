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

/**
 * Decodifica a "payload" de um JWT sem validar a assinatura.
 * Validar a assinatura é responsabilidade do backend; no frontend só
 * precisamos ler os dados (claims) para saber quem é o usuário e
 * quando o token expira.
 */
function decodeToken(token: string): DecodedToken | null {
  try {
    const payloadBase64 = token.split('.')[1]
    const json = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')))
    return json as DecodedToken
  } catch {
    return null
  }
}

function isTokenExpired(decoded: DecodedToken | null): boolean {
  if (!decoded?.exp) return true
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

  const applyToken = useCallback((newToken: string) => {
    const decoded = decodeToken(newToken)
    if (!decoded || isTokenExpired(decoded)) {
      localStorage.removeItem(TOKEN_KEY)
      setToken(null)
      setUser(null)
      return
    }

    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
    setUser({
      id: decoded.sub,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
    })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const login = useCallback(
    async (payload: LoginPayload) => {
      const { token: newToken } = await authService.login(payload)
      applyToken(newToken)
    },
    [applyToken]
  )

  // Ao montar o app: restaura a sessão a partir do localStorage, se existir.
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    if (savedToken) {
      applyToken(savedToken)
    }
    setIsLoading(false)
  }, [applyToken])

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
