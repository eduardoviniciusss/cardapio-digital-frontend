import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Envolve qualquer página que só deve existir para usuários logados.
 * - Enquanto ainda estamos checando o localStorage, não decide nada (evita
 *   redirecionar para /login por um instante antes da sessão carregar).
 * - Sem sessão válida -> manda para /login, guardando de onde o usuário veio
 *   em location.state, para devolvê-lo à página certa depois do login.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <div className="page-loading">Carregando…</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
