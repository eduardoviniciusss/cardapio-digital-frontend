// Layout principal: cabeçalho com menu por papel + área de conteúdo.
// Recebe a página como "children" (o helper Private, em AppRoutes, faz isso).

import { useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { roleLabels, UserRole } from '@/types/auth'
import { actingUserIdForPath, scopeForPath } from '@/services/acting'
import ActingBar from './ActingBar'
import './Layout.css'

/** Links do menu para cada papel */
const NAV_BY_ROLE: Record<string, { to: string; label: string; icon: string; end?: boolean }[]> = {
  // O Administrador faz tudo: gerencia escolas e, escolhendo uma escola ou um
  // responsável na barra "atuar como", usa as mesmas telas da Cantina e do Responsável.
  Administrator: [
    { to: '/', label: 'Início', icon: '🏠', end: true },
    { to: '/escolas', label: 'Escolas', icon: '🏫' },
    { to: '/categorias', label: 'Categorias', icon: '🏷️' },
    { to: '/produtos', label: 'Produtos', icon: '🥪' },
    { to: '/cardapios', label: 'Cardápios', icon: '🍽️' },
    { to: '/pedidos', label: 'Pedidos', icon: '🧾' },
    { to: '/filhos', label: 'Responsáveis', icon: '👨‍👩‍👧' },
  ],
  Canteen: [
    { to: '/', label: 'Início', icon: '🏠', end: true },
    { to: '/escolas', label: 'Escola', icon: '🏫' },
    { to: '/categorias', label: 'Categorias', icon: '🏷️' },
    { to: '/produtos', label: 'Produtos', icon: '🥪' },
    { to: '/cardapios', label: 'Cardápios', icon: '🍽️' },
    { to: '/pedidos', label: 'Pedidos', icon: '🧾' },
  ],
  Parent: [
    { to: '/', label: 'Início', icon: '🏠', end: true },
    { to: '/filhos', label: 'Filhos', icon: '👨‍👩‍👧' },
    { to: '/meus-pedidos', label: 'Pedidos', icon: '🧾' },
  ],
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  // Só para forçar uma nova renderização quando o Admin troca a escola/responsável
  const [, setActingVersion] = useState(0)

  // Para o Administrador, algumas telas precisam de uma escola ou de um responsável escolhido
  const actingScope = user?.role === UserRole.Administrator ? scopeForPath(location.pathname) : null
  const actingUserId = actingScope ? actingUserIdForPath(location.pathname) : null

  const navLinks = user ? (NAV_BY_ROLE[user.role] ?? []) : []
  const roleLabel = user ? (roleLabels[user.role as UserRole] ?? user.role) : ''

  return (
    <div className="layout">
      <header className="topbar">
        <Link to="/" className="topbar-brand">
          <span className="topbar-brand__logo" aria-hidden="true">🥗</span>
          Cardápio Digital
        </Link>

        <div className="topbar-user">
          {user && <span className="chip chip-green topbar-role-badge">{roleLabel}</span>}
          <button type="button" className="topbar-logout" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      {actingScope && (
        <ActingBar scope={actingScope} onChange={() => setActingVersion((v) => v + 1)} />
      )}

      {/* A "key" recria a tela quando a escolha muda, para ela buscar os dados de novo */}
      <main className="main-content" key={actingUserId ?? 'none'}>
        {actingScope && actingUserId === null ? (
          <p className="page-status">
            {actingScope === 'school'
              ? 'Selecione uma escola acima para gerenciar categorias, produtos e cardápios.'
              : 'Selecione um responsável acima para ver os filhos e agendar lanches.'}
          </p>
        ) : (
          children
        )}
      </main>

      <nav
        className={`bottom-nav${navLinks.length > 5 ? ' bottom-nav--scroll' : ''}`}
        aria-label="Menu principal"
      >
        {navLinks.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className="bn-item">
            <span className="bn-icon" aria-hidden="true">
              {link.icon}
            </span>
            <span className="bn-label">{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
