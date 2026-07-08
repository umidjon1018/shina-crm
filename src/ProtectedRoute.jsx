import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

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
