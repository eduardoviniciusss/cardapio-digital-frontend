import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { UserRole } from '@/types/auth'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
}

/**
 * Casca visual comum a todas as páginas depois do login: cabeçalho com o
 * nome do app, navegação (que muda de acordo com o papel do usuário) e
 * botão de sair. As telas (Dashboard, Schools, ...) só cuidam do próprio
 * conteúdo — nunca precisam se preocupar com cabeçalho/navegação.
 */
export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth()
  const canSeeSchools = user?.role === UserRole.Administrator || user?.role === UserRole.Canteen

  return (
    <div className="app-layout">
      <header className="app-header">
        <span className="app-header__brand">Cardápio Digital</span>

        <nav className="app-header__nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
            Início
          </NavLink>
          {canSeeSchools && (
            <NavLink to="/escolas" className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
              Escolas
            </NavLink>
          )}
          {canSeeSchools && (
            <NavLink to="/categorias" className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
              Categorias
            </NavLink>
          )}
        </nav>

        <div className="app-header__user">
          {user?.name && <span className="app-header__username">{user.name}</span>}
          <button type="button" className="app-header__logout" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      <main className="app-main">{children}</main>
    </div>
  )
}