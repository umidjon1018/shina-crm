import { useEffect, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useThemeStore } from './store/themeStore'
import { useLangStore } from './store/langStore'
import { ProtectedRoute, DashboardGate, AdminGate, SuperAdminGate } from './ProtectedRoute'

// Layouts
import { AuthLayout } from './layouts/AuthLayout'
import { MainLayout } from './layouts/MainLayout'

// Pages — har biri alohida faylga bo'linadi (faqat ochilganda yuklanadi)
const Login = lazy(() => import('./pages/Login'))
const PendingApproval = lazy(() => import('./pages/PendingApproval'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Warehouse = lazy(() => import('./pages/Warehouse'))
const Sales = lazy(() => import('./pages/Sales'))
const Wholesale = lazy(() => import('./pages/Wholesale'))
const Production = lazy(() => import('./pages/Production'))
const Customers = lazy(() => import('./pages/Customers'))
const Income = lazy(() => import('./pages/Income'))
const Expenses = lazy(() => import('./pages/Expenses'))
const Marketing = lazy(() => import('./pages/Marketing'))
const Reports = lazy(() => import('./pages/Reports'))
const AIAgent = lazy(() => import('./pages/AIAgent'))
const Settings = lazy(() => import('./pages/Settings'))
const Subscription = lazy(() => import('./pages/Subscription'))
const BillingAdmin = lazy(() => import('./pages/BillingAdmin'))

function App() {
  const { initTheme } = useThemeStore()
  const { initLang } = useLangStore()

  useEffect(() => {
    initTheme()
    initLang()
  }, [initTheme, initLang])

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardGate><Dashboard /></DashboardGate>
            </ProtectedRoute>
          } />

          <Route path="/warehouse" element={
            <ProtectedRoute permission="warehouse">
              <Warehouse />
            </ProtectedRoute>
          } />

          <Route path="/sales" element={
            <ProtectedRoute permission="sales">
              <Sales />
            </ProtectedRoute>
          } />

          <Route path="/production" element={
            <ProtectedRoute permission="production">
              <Production />
            </ProtectedRoute>
          } />

          <Route path="/wholesale" element={
            <ProtectedRoute permission="wholesale">
              <Wholesale />
            </ProtectedRoute>
          } />

          <Route path="/customers" element={
            <ProtectedRoute permission="customers">
              <Customers />
            </ProtectedRoute>
          } />

          <Route path="/income" element={
            <ProtectedRoute permission="income">
              <Income />
            </ProtectedRoute>
          } />

          <Route path="/expenses" element={
            <ProtectedRoute permission="expenses">
              <Expenses />
            </ProtectedRoute>
          } />

          <Route path="/marketing" element={
            <ProtectedRoute permission="marketing">
              <Marketing />
            </ProtectedRoute>
          } />

          <Route path="/integrations" element={<Navigate to="/settings?section=integrations" replace />} />

          <Route path="/reports" element={
            <ProtectedRoute permission="reports">
              <Reports />
            </ProtectedRoute>
          } />

          <Route path="/ai-agent" element={
            <ProtectedRoute permission="ai_agent">
              <AIAgent />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          {/* Eski sahifalar Sozlamalarga birlashdi */}
          <Route path="/subscription" element={<ProtectedRoute><AdminGate><Subscription /></AdminGate></ProtectedRoute>} />
          <Route path="/billing-admin" element={<ProtectedRoute><SuperAdminGate><BillingAdmin /></SuperAdminGate></ProtectedRoute>} />
          <Route path="/admin" element={<Navigate to="/settings" replace />} />
          <Route path="/management" element={<Navigate to="/settings" replace />} />
        </Route>

        {/* 404 Redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App
