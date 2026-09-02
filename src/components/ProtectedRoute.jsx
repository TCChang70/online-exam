import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ requiredRole }) {
  const { auth } = useAuth()
  if (!auth) return <Navigate to="/login" replace />
  if (requiredRole && auth.role !== requiredRole) {
    return <Navigate to={auth.role === 'ROLE_TEACHER' ? '/teacher' : '/student'} replace />
  }
  return <Outlet />
}
