import { Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import PageLoader from '../components/PageLoader'
import UpdateBanner from '../components/UpdateBanner'

export const AuthLayout = () => {
  const { isAuthenticated, deviceStatus } = useAuthStore()
  const location = useLocation()
  const isPending = location.pathname === '/pending-approval'

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary transition-colors duration-300">
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
      <UpdateBanner autoApply />
    </div>
  )
}
