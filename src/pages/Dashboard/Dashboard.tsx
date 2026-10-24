// Painel inicial (rota "/"): mostra um painel diferente para cada papel.
// O cabeçalho e o menu já vêm do Layout (ver AppRoutes.tsx).

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useAuth } from '@/context/AuthContext'
import { extractApiErrorMessage } from '@/services/authService'
import { getAllSchools, getAvailableCanteens, getMySchool } from '@/services/schoolService'
import { getCategories } from '@/services/categoryService'
import { getProducts } from '@/services/productService'
import { getMenus } from '@/services/menuService'
import { getChildren } from '@/services/childService'
import { UserRole } from '@/types/auth'

/** Devolve o status HTTP de um erro do Axios (ou undefined se não for um) */
function httpStatus(err: unknown): number | undefined {
  return isAxiosError(err) ? err.response?.status : undefined
}

/** Cartão de resumo clicável (número grande + legenda) */
function SummaryCard({ to, value, label }: { to: string; value: number; label: string }) {
  return (
    <Link to={to} className="summary-card">
      <span className="summary-card__value">{value}</span>
      <span className="summary-card__label">{label}</span>
    </Link>
  )
}

// ---------------------------------------------------------------- Administrador

type AdminState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; schools: number; freeCanteens: number }

function AdminPanel() {
  const [state, setState] = useState<AdminState>({ status: 'loading' })

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [schools, canteens] = await Promise.all([getAllSchools(), getAvailableCanteens()])
        if (!active) return
        setState({ status: 'ready', schools: schools.length, freeCanteens: canteens.length })
      } catch (err) {
        if (!active) return
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

  return (
    <>
      {state.freeCanteens > 0 && (
        <div className="info-alert" role="status">
          Há {state.freeCanteens === 1 ? '1 Cantina' : `${state.freeCanteens} Cantinas`} sem escola
          vinculada. <Link to="/escolas">Criar uma escola</Link>
        </div>
      )}
      <div className="summary-grid">
        <SummaryCard to="/escolas" value={state.schools} label="Escolas cadastradas" />
        <SummaryCard to="/escolas" value={state.freeCanteens} label="Cantinas sem escola" />
      </div>
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
      <div className="info-alert" role="status">
        Sua conta ainda não está vinculada a uma escola. Peça a um Administrador para criar a escola e
        vincular à sua conta.
      </div>
    )
  }

  return (
    <>
      <p className="dashboard-school">
        Escola: <strong>{state.schoolName}</strong>
      </p>
      {state.categories === 0 && (
        <div className="info-alert" role="status">
          Comece pela ordem certa: primeiro categorias, depois produtos, depois cardápios.{' '}
          <Link to="/categorias">Cadastrar categorias</Link>
        </div>
      )}
      <div className="summary-grid">
        <SummaryCard to="/categorias" value={state.categories} label="Categorias" />
        <SummaryCard to="/produtos" value={state.products} label="Produtos" />
        <SummaryCard to="/cardapios" value={state.menus} label="Cardápios" />
      </div>
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
      <div className="info-alert" role="status">
        Falta pouco! Complete seu cadastro de responsável para registrar seus filhos.{' '}
        <Link to="/filhos">Completar cadastro</Link>
      </div>
    )
  }

  return (
    <div className="summary-grid">
      <SummaryCard to="/filhos" value={state.children} label="Filhos cadastrados" />
    </div>
  )
}

// ------------------------------------------------------------------------ Página

export function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="dashboard-page">
      <h1>Olá{user?.name ? `, ${user.name}` : ''} 👋</h1>

      {user?.role === UserRole.Administrator && <AdminPanel />}
      {user?.role === UserRole.Canteen && <CanteenPanel />}
      {user?.role === UserRole.Parent && <ParentPanel />}
    </div>
  )
}
