import { useAuth } from '@/context/AuthContext'
import { roleLabels, type UserRole } from '@/types/auth'

/**
 * Página protegida de exemplo — só é alcançada através do ProtectedRoute.
 * Substitua pelo conteúdo real (lista de cardápios, escolas, etc.) conforme
 * o restante da API for sendo implementado no frontend.
 */
export function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <div style={{ padding: '3rem', maxWidth: 640, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)' }}>Olá{user?.name ? `, ${user.name}` : ''} 👋</h1>
      <p>Você está autenticado no Cardápio Digital.</p>
      {user?.role !== undefined && (
        <p>
          Papel: <strong>{roleLabels[user.role as UserRole] ?? user.role}</strong>
        </p>
      )}
      <button className="btn-primary" style={{ width: 'auto', padding: '0.6rem 1.2rem' }} onClick={logout}>
        Sair
      </button>
    </div>
  )
}
