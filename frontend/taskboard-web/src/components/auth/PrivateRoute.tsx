import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

// Guard de ruta: si el usuario no está autenticado, redirige al login
// Se usa como wrapper en App.tsx: <PrivateRoute><MiPagina /></PrivateRoute>
export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
