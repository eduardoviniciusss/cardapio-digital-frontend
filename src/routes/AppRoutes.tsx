import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { RoleProtectedRoute } from '@/components/RoleProtectedRoute'
import { Layout } from '@/components/Layout'
import { Login } from '@/pages/Login/Login'
import { Register } from '@/pages/Register/Register'
import { Dashboard } from '@/pages/Dashboard/Dashboard'
import { Schools } from '@/pages/Schools/Schools'
import { Categories } from '@/pages/Categories/Categories'
import { UserRole } from '@/types/auth'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rotas públicas — sem Layout (cabeçalho/nav), tela cheia */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />

          {/* Rotas privadas — exigem login, e ganham o Layout (cabeçalho + nav) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/escolas"
            element={
              <RoleProtectedRoute allowedRoles={[UserRole.Administrator, UserRole.Canteen]}>
                <Layout>
                  <Schools />
                </Layout>
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/categorias"
            element={
              <RoleProtectedRoute allowedRoles={[UserRole.Administrator, UserRole.Canteen]}>
                <Layout>
                  <Categories />
                </Layout>
              </RoleProtectedRoute>
            }
          />

          {/* Rota desconhecida -> volta para a home, que decide entre
             mostrar o Dashboard ou redirecionar ao login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}