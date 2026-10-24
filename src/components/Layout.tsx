// Layout principal: cabeçalho com menu por papel + área de conteúdo.
// Recebe a página como "children" (o helper Private, em AppRoutes, faz isso).

import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { roleLabels, type UserRole } from '@/types/auth'
import './Layout.css'

/** Links do menu para cada papel */
const NAV_BY_ROLE: Record<string, { to: string; label: string; end?: boolean }[]> = {
  Administrator: [
    { to: '/', label: 'Início', end: true },
    { to: '/escolas', label: 'Escolas' },
  ],
  Canteen: [
    { to: '/', label: 'Início', end: true },
    { to: '/escolas', label: 'Minha escola' },
    { to: '/categorias', label: 'Categorias' },
    { to: '/produtos', label: 'Produtos' },
    { to: '/cardapios', label: 'Cardápios' },
  ],
  Parent: [
    { to: '/', label: 'Início', end: true },
    { to: '/filhos', label: 'Meus filhos' },
  ],
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()

  const navLinks = user ? (NAV_BY_ROLE[user.role] ?? []) : []
  const roleLabel = user ? (roleLabels[user.role as UserRole] ?? user.role) : ''

  return (
    <div className="layout">
      <header className="topbar">
        <Link to="/" className="topbar-brand">
          🍽️ Cardápio Digital
        </Link>

        <nav className="topbar-nav" aria-label="Menu principal">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="topbar-user">
          {user && (
            <>
              <span className="topbar-role-badge">{roleLabel}</span>
              <span className="topbar-username">{user.name}</span>
            </>
          )}
          <button type="button" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      <main className="main-content">{children}</main>
    </div>
  )
}
