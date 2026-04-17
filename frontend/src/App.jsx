import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import DashboardLayout from './components/DashboardLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'

function PrivateRoute({ children }) {
  const { user, booting } = useAuth()
  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-surface-950">
        <p className="text-slate-500">Cargando…</p>
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

function DashboardHomeRedirect() {
  const { isSuperadmin } = useAuth()
  return <Navigate to={isSuperadmin ? '/usuarios' : '/credenciales'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<DashboardHomeRedirect />} />
            <Route path=":section" element={<DashboardPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
