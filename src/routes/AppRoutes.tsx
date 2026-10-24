import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { RoleProtectedRoute } from '@/components/RoleProtectedRoute'
import Layout from '@/components/Layout'
import { Login } from '@/pages/Login/Login'
import Register from '@/pages/Register/Register'
import { Dashboard } from '@/pages/Dashboard/Dashboard'
import Schools from '@/pages/Schools/Schools'
import Categories from '@/pages/Categories/Categories'
import Products from '@/pages/Products/Products'
import Menus from '@/pages/Menus/Menus'
import MyChildren from '@/pages/Children/MyChildren'
import ChildMenuPage from '@/pages/Children/ChildMenuPage'
import MyOrders from '@/pages/Orders/MyOrders'
import SchoolOrders from '@/pages/Orders/SchoolOrders'
import { UserRole } from '@/types/auth'

/**
 * Helper para rotas privadas: aplica a proteção e o Layout (cabeçalho + menu).
 * - Sem "roles": basta estar logado.
 * - Com "roles": o papel do usuário precisa estar na lista.
 */
function Private({ roles, children }: { roles?: UserRole[]; children: ReactNode }) {
  const page = <Layout>{children}</Layout>

  if (!roles) {
    return <ProtectedRoute>{page}</ProtectedRoute>
  }
  return <RoleProtectedRoute allowedRoles={roles}>{page}</RoleProtectedRoute>
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rotas públicas (tela cheia, sem Layout) */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />

          {/* Rotas privadas */}
          <Route
            path="/"
            element={
              <Private>
                <Dashboard />
              </Private>
            }
          />
          <Route
            path="/escolas"
            element={
              <Private roles={[UserRole.Administrator, UserRole.Canteen]}>
                <Schools />
              </Private>
            }
          />
          <Route
            path="/categorias"
            element={
              <Private roles={[UserRole.Administrator, UserRole.Canteen]}>
                <Categories />
              </Private>
            }
          />
          <Route
            path="/produtos"
            element={
              <Private roles={[UserRole.Administrator, UserRole.Canteen]}>
                <Products />
              </Private>
            }
          />
          <Route
            path="/cardapios"
            element={
              <Private roles={[UserRole.Administrator, UserRole.Canteen]}>
                <Menus />
              </Private>
            }
          />
          <Route
            path="/filhos"
            element={
              <Private roles={[UserRole.Administrator, UserRole.Parent]}>
                <MyChildren />
              </Private>
            }
          />
          <Route
            path="/filhos/:childId/cardapio"
            element={
              <Private roles={[UserRole.Administrator, UserRole.Parent]}>
                <ChildMenuPage />
              </Private>
            }
          />

          <Route
            path="/meus-pedidos"
            element={
              <Private roles={[UserRole.Administrator, UserRole.Parent]}>
                <MyOrders />
              </Private>
            }
          />
          <Route
            path="/pedidos"
            element={
              <Private roles={[UserRole.Administrator, UserRole.Canteen]}>
                <SchoolOrders />
              </Private>
            }
          />

          {/* Qualquer outra rota volta para a home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
