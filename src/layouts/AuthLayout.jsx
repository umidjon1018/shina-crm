import { Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Navigate } from 'react-router-dom'

export const AuthLayout = () => {
  const { isAuthenticated, deviceStatus } = useAuthStore()
  const location = useLocation()
  const isPending = location.pathname === '/pending-approval'

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary transition-colors duration-300">
      <Outlet />
    </div>
  )
}
