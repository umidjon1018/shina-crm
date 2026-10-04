import { useEffect, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useThemeStore } from './store/themeStore'
import { useLangStore } from './store/langStore'
import { ProtectedRoute } from './ProtectedRoute'

// Layouts
import { AuthLayout } from './layouts/AuthLayout'
import { MainLayout } from './layouts/MainLayout'

// Pages — har biri alohida faylga bo'linadi (faqat ochilganda yuklanadi)
const Login = lazy(() => import('./pages/Login'))
const PendingApproval = lazy(() => import('./pages/PendingApproval'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Warehouse = lazy(() => import('./pages/Warehouse'))
const Sales = lazy(() => import('./pages/Sales'))
const Customers = lazy(() => import('./pages/Customers'))
const Income = lazy(() => import('./pages/Income'))
const Expenses = lazy(() => import('./pages/Expenses'))
const Marketing = lazy(() => import('./pages/Marketing'))
const Reports = lazy(() => import('./pages/Reports'))
const AIAgent = lazy(() => import('./pages/AIAgent'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const Management = lazy(() => import('./pages/Management'))

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
              <Dashboard />
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

          <Route path="/admin" element={
            <ProtectedRoute permission="all">
              <AdminPanel />
            </ProtectedRoute>
          } />
          
          <Route path="/management" element={
            <ProtectedRoute permission="management">
              <Management />
            </ProtectedRoute>
          } />
        </Route>

        {/* 404 Redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App
