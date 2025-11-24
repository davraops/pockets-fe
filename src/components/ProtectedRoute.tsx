import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api } from '../services/api'

interface ProtectedRouteProps {
  children: React.ReactElement
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const isAuthenticated = api.isAuthenticated()

  useEffect(() => {
    // Si no está autenticado, no hacer nada aquí, Navigate se encargará
    if (!isAuthenticated) {
      // Opcional: limpiar cualquier token inválido
      api.logout()
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    // Redirigir a login guardando la ubicación actual para poder volver después
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
