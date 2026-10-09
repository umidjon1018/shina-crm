import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useBillingStore } from './store/billingStore'

// Bosh sahifaga ruxsati yo'q xodim uchun — ruxsati bor birinchi sahifa
const HOME_ORDER = [['dashboard', '/dashboard'], ['sales', '/sales'], ['warehouse', '/warehouse'], ['wholesale', '/wholesale'], ['production', '/production'], ['customers', '/customers'],
  ['income', '/income'], ['expenses', '/expenses'], ['reports', '/reports'], ['marketing', '/marketing'],
  ['ai_agent', '/ai-agent'], ['settings', '/settings']]
export const homePath = (hasPermission) => (HOME_ORDER.find(([perm]) => hasPermission(perm)) || HOME_ORDER[0])[1]

// Obuna sahifasi — faqat do'kon admini; SICRM boshqaruvi — faqat super-admin (server ham tekshiradi)
export const AdminGate = ({ children }) => {
  const role = useAuthStore(s => s.user?.role)
  return role === 'admin' ? children : <Navigate to="/dashboard" replace />
}
export const SuperAdminGate = ({ children }) => {
  const status = useBillingStore(s => s.status)
  if (!status) return null
  return status.superAdmin ? children : <Navigate to="/dashboard" replace />
}

export const DashboardGate = ({ children }) => {
  const hasPermission = useAuthStore(s => s.hasPermission)
  if (hasPermission('dashboard')) return children
  const to = homePath(hasPermission)
  return to === '/dashboard' ? children : <Navigate to={to} replace />
}

export const ProtectedRoute = ({ children, permission }) => {
  const { isAuthenticated, hasPermission } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permission && !hasPermission(permission)) {
    // In a real app, you'd show a toast here
    alert("Sizda bu sahifaga ruxsat yo'q");
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
