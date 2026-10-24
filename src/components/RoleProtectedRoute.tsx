import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ProtectedRoute } from './ProtectedRoute'
import type { UserRole } from '@/types/auth'

interface RoleProtectedRouteProps {
  children: ReactNode
  allowedRoles: UserRole[]
}

/**
 * Igual ao ProtectedRoute (exige login), mas também exige que o papel do
 * usuário esteja na lista de papéis permitidos para aquela rota.
 * Ex.: <RoleProtectedRoute allowedRoles={[UserRole.Canteen]}>.
 */
export function RoleProtectedRoute({ children, allowedRoles }: RoleProtectedRouteProps) {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <RoleGate allowedRoles={allowedRoles} userRole={user?.role}>
        {children}
      </RoleGate>
    </ProtectedRoute>
  )
}

function RoleGate({
  children,
  allowedRoles,
  userRole,
}: {
  children: ReactNode
  allowedRoles: UserRole[]
  userRole?: string
}) {
  const isAllowed = userRole !== undefined && allowedRoles.includes(userRole as UserRole)

  // Logado, mas sem permissão para esta área: volta para a home
  if (!isAllowed) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
