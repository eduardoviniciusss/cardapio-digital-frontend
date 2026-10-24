import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Envolve qualquer página que só deve existir para usuários logados.
 * - Enquanto ainda restauramos a sessão do localStorage, não decide nada
 *   (evita mandar para /login por um instante antes da sessão carregar).
 * - Sem usuário -> manda para /login, guardando de onde ele veio em
 *   location.state para devolvê-lo à página certa depois do login.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="page-loading">Carregando…</div>
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
