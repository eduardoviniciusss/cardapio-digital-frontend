// Painel inicial (rota "/"): mostra um painel diferente para cada papel.
// O cabeçalho e o menu já vêm do Layout (ver AppRoutes.tsx).

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useAuth } from '@/context/AuthContext'
import { extractApiErrorMessage } from '@/services/authService'
import { getAllSchools, getMySchool } from '@/services/schoolService'
import { getCategories } from '@/services/categoryService'
import { getProducts } from '@/services/productService'
import { getMenus } from '@/services/menuService'
import { getChildren } from '@/services/childService'
import { UserRole } from '@/types/auth'

/** Devolve o status HTTP de um erro do Axios (ou undefined se não for um) */
function httpStatus(err: unknown): number | undefined {
  return isAxiosError(err) ? err.response?.status : undefined
}

function greetingByHour(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia,'
  if (hour < 18) return 'Boa tarde,'
  return 'Boa noite,'
}

interface HeroStat {
  value: number
  label: string
}

/** Cabeçalho colorido do início: saudação + números principais */
function Hero({
  canteen,
  school,
  stats = [],
}: {
  canteen?: boolean
  school?: string
  stats?: HeroStat[]
}) {
  const { user } = useAuth()

  return (
    <div className={`hero${canteen ? ' hero--canteen' : ''}`}>
      <div className="hero__greeting">{greetingByHour()}</div>
      <div className="hero__name">{user?.name ?? 'Olá'} 👋</div>
      {school && <div className="hero__school">{school} 🏫</div>}
      {stats.length > 0 && (
        <div className="hero__stats">
          {stats.map((stat) => (
            <div key={stat.label} className="hero__stat">
              <span className="hero__stat-value">{stat.value}</span>
              <span className="hero__stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface ActionItem {
  to: string
  icon: string
  label: string
}

/** Ações rápidas (cartões 2 por linha) */
function Actions({ items }: { items: ActionItem[] }) {
  return (
    <>
      <div className="section-label">Ações rápidas</div>
      <div className="action-grid">
        {items.map((item) => (
          <Link key={item.to} to={item.to} className="action-card">
            <span className="action-card__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="action-card__label">{item.label}</span>
          </Link>
        ))}
      </div>
    </>
  )
}

// ---------------------------------------------------------------- Administrador

type AdminState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; schools: number }

function AdminPanel() {
  const [state, setState] = useState<AdminState>({ status: 'loading' })

  useEffect(() => {
    let active = true

    getAllSchools()
      .then((schools) => {
        if (!active) return
        setState({
          status: 'ready',
          schools: schools.length,
        })
      })
      .catch((err) => {
        if (!active) return
        setState({
          status: 'error',
          message: extractApiErrorMessage(err, 'Erro ao carregar o painel.'),
        })
      })

    return () => {
      active = false
    }
  }, [])

  if (state.status === 'loading') {
    return <p className="page-status">Carregando…</p>
  }

  if (state.status === 'error') {
    return (
      <p className="page-status" role="alert">
        {state.message}
      </p>
    )
  }

  return (
    <>
      <Hero stats={[{ value: state.schools, label: 'Escolas cadastradas' }]} />
      <Actions
        items={[
          { to: '/escolas', icon: '🏫', label: 'Escolas' },
          { to: '/categorias', icon: '🏷️', label: 'Categorias' },
          { to: '/produtos', icon: '🥪', label: 'Produtos' },
          { to: '/cardapios', icon: '🍽️', label: 'Cardápios' },
        ]}
      />
    </>
  )
}

// --------------------------------------------------------------------- Cantina

type CanteenState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'no-school' }
  | {
      status: 'ready'
      schoolName: string
      categories: number
      products: number
      menus: number
    }

function CanteenPanel() {
  const [state, setState] = useState<CanteenState>({ status: 'loading' })

  useEffect(() => {
    let active = true

    async function load() {
      try {
        // GET /schools responde 404 quando a Cantina ainda não tem escola
        const school = await getMySchool()
        const [categories, products, menus] = await Promise.all([
          getCategories(),
          getProducts(),
          getMenus(),
        ])
        if (!active) return
        setState({
          status: 'ready',
          schoolName: school.name,
          categories: categories.length,
          products: products.length,
          menus: menus.length,
        })
      } catch (err) {
        if (!active) return
        if (httpStatus(err) === 404) {
          setState({ status: 'no-school' })
          return
        }
        setState({ status: 'error', message: extractApiErrorMessage(err, 'Erro ao carregar o painel.') })
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  if (state.status === 'loading') return <p className="page-status">Carregando…</p>
  if (state.status === 'error') {
    return (
      <p className="page-status" role="alert">
        {state.message}
      </p>
    )
  }
  if (state.status === 'no-school') {
    return (
      <>
        <Hero canteen />
        <div className="info-alert" role="status">
          Sua conta ainda não está vinculada a uma escola. Peça a um Administrador para criar a escola e
          vincular à sua conta.
        </div>
      </>
    )
  }

  return (
    <>
      <Hero
        canteen
        school={state.schoolName}
        stats={[
          { value: state.categories, label: 'Categorias' },
          { value: state.products, label: 'Produtos' },
          { value: state.menus, label: 'Cardápios' },
        ]}
      />
      {state.categories === 0 && (
        <div className="info-alert" role="status">
          Comece pela ordem certa: primeiro categorias, depois produtos, depois cardápios.{' '}
          <Link to="/categorias">Cadastrar categorias</Link>
        </div>
      )}
      <Actions
        items={[
          { to: '/pedidos', icon: '🧾', label: 'Pedidos do dia' },
          { to: '/cardapios', icon: '🍽️', label: 'Gestão de Cardápio' },
          { to: '/produtos', icon: '🥪', label: 'Produtos' },
          { to: '/categorias', icon: '🏷️', label: 'Categorias' },
        ]}
      />
    </>
  )
}

// ----------------------------------------------------------------- Responsável

type ParentState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'needs-registration' }
  | { status: 'ready'; children: number }

function ParentPanel() {
  const [state, setState] = useState<ParentState>({ status: 'loading' })

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const children = await getChildren()
        if (!active) return
        setState({ status: 'ready', children: children.length })
      } catch (err) {
        if (!active) return
        // 404 = o responsável ainda não completou o cadastro (não é erro)
        if (httpStatus(err) === 404) {
          setState({ status: 'needs-registration' })
          return
        }
        setState({ status: 'error', message: extractApiErrorMessage(err, 'Erro ao carregar o painel.') })
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  if (state.status === 'loading') return <p className="page-status">Carregando…</p>
  if (state.status === 'error') {
    return (
      <p className="page-status" role="alert">
        {state.message}
      </p>
    )
  }
  if (state.status === 'needs-registration') {
    return (
      <>
        <Hero />
        <div className="info-alert" role="status">
          Falta pouco! Complete seu cadastro de responsável para registrar seus filhos.{' '}
          <Link to="/filhos">Completar cadastro</Link>
        </div>
      </>
    )
  }

  return (
    <>
      <Hero stats={[{ value: state.children, label: 'Filhos cadastrados' }]} />
      <Actions
        items={[
          { to: '/filhos', icon: '👨‍👩‍👧', label: 'Meus filhos' },
          { to: '/meus-pedidos', icon: '🧾', label: 'Meus pedidos' },
        ]}
      />
    </>
  )
}

// ------------------------------------------------------------------------ Página

export function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="dashboard-page">
      {user?.role === UserRole.Administrator && <AdminPanel />}
      {user?.role === UserRole.Canteen && <CanteenPanel />}
      {user?.role === UserRole.Parent && <ParentPanel />}
    </div>
  )
}
