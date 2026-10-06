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
 * Ex: <RoleProtectedRoute allowedRoles={[UserRole.Administrator]}>.
 *
 * Reaproveita o ProtectedRoute por fora para não duplicar a lógica de
 * "ainda carregando" / "sem sessão" — aqui só acrescentamos a checagem
 * de papel, que roda depois que já sabemos que o usuário está logado.
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
  userRole?: number
}) {
  const isAllowed = userRole !== undefined && allowedRoles.includes(userRole as UserRole)

  if (!isAllowed) {
    // Usuário logado, mas sem permissão para esta área — volta para a home
    // em vez de mostrar uma tela quebrada.
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
