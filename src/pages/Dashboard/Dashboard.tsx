import { useAuth } from '@/context/AuthContext'
import { roleLabels, type UserRole } from '@/types/auth'

/**
 * Home pós-login. O cabeçalho/navegação já vêm do Layout (ver AppRoutes.tsx)
 * — esta página cuida só do próprio conteúdo.
 */
export function Dashboard() {
  const { user } = useAuth()

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>
        Olá{user?.name ? `, ${user.name}` : ''} 👋
      </h1>
      <p>Você está autenticado no Cardápio Digital.</p>
      {user?.role !== undefined && (
        <p>
          Papel: <strong>{roleLabels[user.role as UserRole] ?? user.role}</strong>
        </p>
      )}
    </div>
  )
}
