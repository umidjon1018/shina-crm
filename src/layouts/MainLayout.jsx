import { Navigate, Outlet, Link, useLocation } from 'react-router-dom'
import PageErrorBoundary from '../components/PageErrorBoundary'
import { useRealtime } from '../hooks/useRealtime'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Wallet,
  BarChart3,
  Bot,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  Users,
  WifiOff,
  X,
  Globe,
  Pencil,
  Eye,
  EyeOff,
  Megaphone
} from 'lucide-react'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { syncRolesFromServer } from '../utils/rolesSync'
import { migrateLocalBundles } from '../utils/migrateLocalBundles'
import { createSale } from '../api/salesService'
import { useDataStore } from '../store/dataStore'
import PageLoader from '../components/PageLoader'
import UpdateBanner from '../components/UpdateBanner'
import Toaster, { toast } from '../components/ui/Toast'
import NumpadHost from '../components/ui/NumpadHost'
import NotificationsPanel from '../components/NotificationsPanel'
import { visibleSettingsSections } from '../pages/Settings'
import { useShopStore } from '../store/shopStore'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { useLangStore } from '../store/langStore'
import { useOfflineSync } from '../hooks/useOfflineSync'
import { usePinchZoom } from '../hooks/usePinchZoom'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { useTranslation } from 'react-i18next'
import { useNotificationStore } from '../store/notificationStore'
import { useSettingsStore } from '../store/settingsStore'
import { useAuditStore } from '../store/auditStore'

const PAGE_KEYS = {
  '/dashboard': 'dashboard',
  '/warehouse': 'warehouse',
  '/sales': 'sales',
  '/customers': 'customers',
  '/income': 'income',
  '/expenses': 'expenses',
  '/marketing': 'marketing',
  '/reports': 'reports',
  '/ai-agent': 'ai_agent',
  '/settings': 'nav_settings',
}

const SidebarItem = ({ to, icon: Icon, label, isActive, onClick, replace }) => (
  <Link
    to={to}
    replace={replace}
    onClick={onClick}
    className={`
      relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group
      ${isActive
        ? 'g-brand text-white shadow-glow-red'
        : 'text-sidebarText hover:text-white hover:bg-white/5'}
    `}
  >
    {isActive && <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-r-full bg-white/90" />}
    <Icon size={20} className={`${isActive ? 'text-white' : 'text-sidebarMuted group-hover:text-white'} transition-colors flex-shrink-0`} />
    <span className="font-semibold text-[15px]">{label}</span>
    {isActive && <ChevronRight size={16} className="ml-auto opacity-70" />}
  </Link>
)

const SidebarSection = ({ label, children }) => (
  <div className="mb-3">
    <p className="px-4 text-xs font-bold text-accent-pink uppercase tracking-widest mb-1.5">{label}</p>
    <div className="space-y-1">{children}</div>
  </div>
)

export const MainLayout = () => {
  const { isAuthenticated, logout, user, hasPermission, updateProfile, verifyPassword } = useAuthStore()
  const { lang, setLang } = useLangStore()
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  // Telefonda menyu ochilganda tarixga belgi qo'yiladi — "orqaga" tugmasi avval menyuni yopadi
  useEffect(() => {
    if (!isSidebarOpen) return
    const onPop = () => setIsSidebarOpen(false)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [isSidebarOpen])
  const openSidebar = () => {
    window.history.pushState({ ...(window.history.state || {}), sidebar: true }, '')
    setIsSidebarOpen(true)
  }
  // Fon yoki yopish tugmasi — tarixdagi belgi ham olib tashlanadi (popstate menyuni yopadi)
  const closeSidebarBack = () => {
    if (window.history.state?.sidebar) window.history.back()
    else setIsSidebarOpen(false)
  }
  const [showProfile, setShowProfile] = useState(false)
  const { addNotification } = useNotificationStore()
  const { bump } = useDataStore()
  // Offlayn navbat: internet qaytganda sotuvlar serverga yuboriladi
  const syncHandler = useCallback(async (item) => {
    if (item.type === 'CREATE_SALE') await createSale(item.payload)
  }, [])
  const onSyncResult = useCallback(({ synced, rejected = [] }) => {
    if (synced) bump()
    rejected.forEach(({ item, error }) => addNotification({
      type: 'OFFLINE_SALE_REJECTED', severity: 'danger',
      title: t('sl_off_rejected_title'),
      message: t('sl_off_rejected_msg', {
        items: (item.payload?.items || []).map(i => i.name).join(', '),
        error,
      }),
    }))
  }, [bump, addNotification, t])
  const { isOnline, pendingCount, isSyncing } = useOfflineSync(syncHandler, onSyncResult)
  const { areaRef, contentRef, zoom, resetZoom } = usePinchZoom()
  const { companyName, companyLogo, sidebarLabels, hiddenPages, sidebarLogoSize, employees, loadEmployees, loadProductCategories, loadProductImages, loadBranding, loadBusiness } = useSettingsStore()
  const { shops, selectedShopId, setSelectedShop, loadShops } = useShopStore()
  const activeShops = shops.filter(s => s.isActive)

  useEffect(() => {
    loadShops()
    loadEmployees()
    loadProductCategories()
    loadProductImages()
    loadBranding(user?.role === 'admin')
    loadBusiness(user?.role)
    useNotificationStore.getState().load()
    if (user?.role === 'admin' || user?.role === 'manager') migrateLocalBundles()
    syncRolesFromServer().catch(() => {})
    // Ilovaga qaytganda ruxsatlar yangilanadi (admin o'zgartirgan bo'lsa)
    const onVisible = () => { if (document.visibilityState === 'visible') syncRolesFromServer().catch(() => {}) }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // Real vaqt: ruxsat o'zgarsa — darhol qo'llanadi; qurilma bekor qilinsa/xodim o'chirilsa — darhol chiqariladi
  const kick = (reasonKey) => {
    try { sessionStorage.setItem('shina_logout_reason', t(reasonKey)) } catch {}
    logout()
  }
  useRealtime({
    perm_changed: () => { syncRolesFromServer().catch(() => {}); loadEmployees() },
    settings_changed: () => loadBusiness(user?.role),
    notification: (d) => {
      const n = useNotificationStore.getState().upsertFromServer(d)
      const mine = String(d.createdById) === String(user?.id) && d.createdByType === (user?.userType || (user?.role === 'admin' ? 'user' : 'employee'))
      if (d.type === 'DISCOUNT_REQUEST' && d.status === 'pending' && !mine) {
        toast(t('notif_toast_discount_request', { seller: n.sellerName || d.createdByName, discount: n.requestedDiscount }))
      }
    },
    notification_updated: (d) => useNotificationStore.getState().upsertFromServer(d),
    device_revoked: (d) => { if (user?.role !== 'admin') kick(d.reason === 'other_device' ? 'rt_kick_other_device' : 'rt_kick_revoked') },
    account_disabled: () => kick('rt_kick_disabled'),
    login_attempt: (d) => {
      if (useSettingsStore.getState().notificationSettings?.NEW_LOGIN_ATTEMPT !== false) {
        addNotification({
          type: 'NEW_LOGIN_ATTEMPT', severity: 'warning',
          title: t('rt_attempt_title'),
          message: t('rt_attempt_msg', { name: d.fullName || '—', device: d.deviceType === 'mobile' ? t('rt_device_mobile') : t('rt_device_desktop') }),
        })
      }
      window.dispatchEvent(new Event('shina:attempts-changed'))
    },
    attempts_changed: () => window.dispatchEvent(new Event('shina:attempts-changed')),
    weekly_report: (d) => addNotification({
      type: 'WEEKLY_REPORT', severity: 'info',
      title: t('ais_notif_title'),
      message: t('ais_notif_msg', { week: (d.weekStart || '').split('-').reverse().join('.') }),
    }),
  }, { enabled: isAuthenticated, onAuthFail: (status) => { if (status === 401) kick('rt_kick_session') } })
  const { addLog } = useAuditStore()
  const sl = sidebarLabels || {}
  const hidden = hiddenPages || []
  const getSlLabel = (key) => {
    const val = sl[key]
    if (!val) return ''
    if (typeof val === 'object') return val[i18n.language] || ''
    return i18n.language === 'uz' ? val : ''
  }

  const isPrivileged = (role) => role === 'admin' || role === 'manager'

  useEffect(() => {
    if (!isAuthenticated || !user) return
    addLog({
      userId: user.id,
      userName: user.fullName || user.name || user.username,
      action: t('nav_page_visited'),
      actionKey: 'audit_page_visited',
      entity: 'page',
      details: PAGE_KEYS[location.pathname] ? t(PAGE_KEYS[location.pathname]) : location.pathname,
    })
  }, [location.pathname, isAuthenticated])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const closeSidebar = () => setIsSidebarOpen(false)
  const isActive = (path) => location.pathname === path

  return (
    <div className="flex h-[100dvh] bg-bg-primary text-text-primary overflow-hidden">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeSidebarBack}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0 w-72 safe-sidebar bg-sidebar border-r border-white/5 z-50
        transition-transform duration-300 transform flex flex-col flex-shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border/20">
          {companyLogo
            ? <img
                src={companyLogo}
                alt="logo"
                className={`rounded-xl object-contain flex-shrink-0 ${
                  sidebarLogoSize === 'small'  ? 'w-8 h-8' :
                  sidebarLogoSize === 'large'  ? 'w-16 h-16' : 'w-12 h-12'
                }`}
              />
            : <div className="w-8 h-8 bg-accent-red rounded-lg flex items-center justify-center shadow-glow-red flex-shrink-0">
                <Package size={16} className="text-white" />
              </div>
          }
          <div className="min-w-0">
            <h1 className="text-base font-syne font-bold text-white leading-tight">{companyName}</h1>
            <p className="text-[10px] text-sidebarMuted uppercase tracking-widest">CRM</p>
          </div>
          <NotificationsPanel className="ml-auto hidden lg:block" />
        </div>

        {/* Offline badge */}
        {(!isOnline || pendingCount > 0) && (
          <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-accent-orange/10 border border-accent-orange/20 flex items-center gap-2">
            <WifiOff size={14} className="text-accent-orange flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-accent-orange font-medium block">
                {isSyncing ? t('syncing') : !isOnline ? t('offline_badge') : t('sync_done')}
              </span>
              {pendingCount > 0 && (
                <span className="text-xs text-accent-orange opacity-70">
                  {pendingCount} {t('offline_queue')}
                </span>
              )}
            </div>
            {isSyncing && (
              <div className="w-3 h-3 border border-accent-orange border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
          </div>
        )}

        {/* Shop selector */}
        {activeShops.length >= 1 && (
          <div className="mx-3 mt-3 mb-1">
            {isPrivileged(user?.role) ? (
              <select
                value={selectedShopId}
                onChange={e => setSelectedShop(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[15px] text-white focus:outline-none focus:border-accent-red [&>option]:text-black"
              >
                <option value="all">{t('all_shops')}</option>
                {activeShops.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-accent-red flex-shrink-0" />
                <span className="text-[15px] text-white truncate">
                  {activeShops.find(s => s.id === selectedShopId)?.name || t('all_shops')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-3">

          {/* Main */}
          {hasPermission('dashboard') && !hidden.includes('dashboard') && (
            <SidebarSection label={t('nav_main')}>
              <SidebarItem to="/dashboard" icon={LayoutDashboard} label={getSlLabel('dashboard') || t('dashboard')} isActive={isActive('/dashboard')} onClick={closeSidebar} replace={isSidebarOpen} />
            </SidebarSection>
          )}

          {/* Trade */}
          {((hasPermission('warehouse') && !hidden.includes('warehouse')) ||
            (hasPermission('sales') && !hidden.includes('sales')) ||
            (hasPermission('customers') && !hidden.includes('customers')) ||
            (hasPermission('marketing') && !hidden.includes('marketing'))) && (
            <SidebarSection label={t('nav_trade')}>
              {hasPermission('warehouse') && !hidden.includes('warehouse') && (
                <SidebarItem to="/warehouse" icon={Package} label={getSlLabel('warehouse') || t('warehouse')} isActive={isActive('/warehouse')} onClick={closeSidebar} replace={isSidebarOpen} />
              )}
              {hasPermission('sales') && !hidden.includes('sales') && (
                <SidebarItem to="/sales" icon={ShoppingCart} label={getSlLabel('sales') || t('sales')} isActive={isActive('/sales')} onClick={closeSidebar} replace={isSidebarOpen} />
              )}
              {hasPermission('customers') && !hidden.includes('customers') && (
                <SidebarItem to="/customers" icon={Users} label={getSlLabel('customers') || t('customers')} isActive={isActive('/customers')} onClick={closeSidebar} replace={isSidebarOpen} />
              )}
              {hasPermission('marketing') && !hidden.includes('marketing') && (
                <SidebarItem to="/marketing" icon={Megaphone} label={getSlLabel('marketing') || t('mkt_page_title')} isActive={isActive('/marketing')} onClick={closeSidebar} replace={isSidebarOpen} />
              )}
            </SidebarSection>
          )}

          {/* Finance */}
          {((hasPermission('income') && !hidden.includes('income')) ||
            (hasPermission('expenses') && !hidden.includes('expenses')) ||
            (hasPermission('reports') && !hidden.includes('reports'))) && (
            <SidebarSection label={t('nav_finance')}>
              {hasPermission('income') && !hidden.includes('income') && (
                <SidebarItem to="/income" icon={TrendingUp} label={getSlLabel('income') || t('income')} isActive={isActive('/income')} onClick={closeSidebar} replace={isSidebarOpen} />
              )}
              {hasPermission('expenses') && !hidden.includes('expenses') && (
                <SidebarItem to="/expenses" icon={Wallet} label={getSlLabel('expenses') || t('fin_page_title')} isActive={isActive('/expenses')} onClick={closeSidebar} replace={isSidebarOpen} />
              )}
              {hasPermission('reports') && !hidden.includes('reports') && (
                <SidebarItem to="/reports" icon={BarChart3} label={getSlLabel('reports') || t('reports')} isActive={isActive('/reports')} onClick={closeSidebar} replace={isSidebarOpen} />
              )}
            </SidebarSection>
          )}

          {/* Other */}
          <SidebarSection label={t('nav_other')}>
            {hasPermission('ai_agent') && !hidden.includes('aiAgent') && (
              <SidebarItem to="/ai-agent" icon={Bot} label={getSlLabel('aiAgent') || t('ai_agent')} isActive={isActive('/ai-agent')} onClick={closeSidebar} replace={isSidebarOpen} />
            )}
            {visibleSettingsSections(user, hasPermission).length > 0 && (
              <SidebarItem to="/settings" icon={Settings} label={t('nav_settings')} isActive={isActive('/settings')} onClick={closeSidebar} replace={isSidebarOpen} />
            )}
          </SidebarSection>

        </nav>

        {/* Bottom: user + lang + theme + logout */}
        <div className="px-3 py-2 border-t border-border/20 space-y-1.5">

          {/* Lang toggle */}
          <div className="flex items-center gap-2 px-2">
            <Globe size={15} className="text-sidebarMuted" />
            <div className="flex gap-1">
              {['uz', 'ru'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold uppercase transition-all ${
                    lang === l
                      ? 'bg-accent-red text-white'
                      : 'text-sidebarMuted hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>

          {/* User info */}
          <div
            className={`flex items-center gap-2 px-2 ${user?.role !== 'admin' ? 'cursor-pointer hover:bg-bg-tertiary rounded-xl' : ''} py-1 -mx-0.5 transition-colors group`}
            onClick={() => user?.role !== 'admin' && setShowProfile(true)}
          >
            <div className="w-7 h-7 rounded-full bg-bg-tertiary border border-border flex items-center justify-center font-bold text-accent-red text-xs flex-shrink-0">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.name}</p>
              <p className="text-xs text-sidebarMuted truncate">{user?.role ? t(`mgmt_role_${user.role}`) : ''}</p>
            </div>
            {user?.role !== 'admin' && (
              <Pencil size={12} className="text-text-muted group-hover:text-accent-red transition-colors flex-shrink-0" />
            )}
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sidebarMuted hover:text-accent-red hover:bg-accent-red/10 transition-all duration-200"
          >
            <LogOut size={14} />
            <span className="font-medium text-xs">{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between safe-header pb-3 border-b border-border bg-bg-secondary">
          <button onClick={openSidebar} className="p-1.5 text-text-secondary">
            <Menu size={22} />
          </button>
          <span className="font-syne font-bold text-sm">{companyName}</span>
          <div className="flex items-center gap-1">
            <NotificationsPanel />
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <div ref={areaRef} className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 safe-bottom no-scrollbar">
          <div ref={contentRef}>
            <Suspense fallback={<PageLoader />}>
              <PageErrorBoundary key={location.pathname}><Outlet /></PageErrorBoundary>
            </Suspense>
          </div>
        </div>
        {zoom !== 1 && (
          <button
            onClick={resetZoom}
            className="fixed z-40 right-4 flex items-center gap-1 px-3 py-1.5 rounded-full bg-text-primary/80 text-bg-primary text-xs font-bold shadow-lg"
            style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
          >
            {Math.round(zoom * 100)}% <X size={12} />
          </button>
        )}
      </main>

      <UpdateBanner />
      <Toaster />
      <NumpadHost />
      <AnimatePresence>
        {showProfile && (
          <ProfileModal
            user={user}
            updateProfile={updateProfile}
            verifyPassword={verifyPassword}
            onClose={() => setShowProfile(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

const ProfileModal = ({ user, updateProfile, verifyPassword, onClose }) => {
  const [form, setForm] = useState({ username: user?.username || '', currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { t } = useTranslation()

  const submit = async () => {
    if (!form.username.trim()) { setError(t('profile_err_empty_login')); return }
    if (!form.currentPassword) { setError(t('profile_err_wrong_password')); return }
    if (form.newPassword && form.newPassword !== form.confirmPassword) { setError(t('profile_err_password_mismatch')); return }
    setLoading(true)
    setError('')
    const valid = await verifyPassword(form.currentPassword)
    if (!valid) { setError(t('profile_err_wrong_password')); setLoading(false); return }
    const result = await updateProfile({ username: form.username.trim(), password: form.newPassword || undefined })
    setLoading(false)
    if (!result.success) { setError(result.message || t('exp_err_generic')); return }
    setSuccess(true)
    setTimeout(onClose, 1000)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-bg-secondary border border-border p-4 sm:p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-syne font-bold text-text-primary text-base">{t('profile_title')}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-muted mb-1 block">{t('profile_login')}</label>
            <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red font-mono" />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1 block">{t('profile_current_password')}</label>
            <div className="relative">
              <input type={showCur ? 'text' : 'password'} value={form.currentPassword}
                onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
                className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 pr-9 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
              <button type="button" onClick={() => setShowCur(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                {showCur ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1 block">{t('profile_new_password')} <span className="opacity-40">({t('profile_new_password_placeholder')})</span></label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} value={form.newPassword}
                onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 pr-9 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
              <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          {form.newPassword && (
            <div>
              <label className="text-xs text-text-muted mb-1 block">{t('profile_confirm_password')}</label>
              <input type="password" value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
            </div>
          )}
        </div>

        {error && <p className="text-xs text-accent-red">{error}</p>}

        <button onClick={submit} disabled={loading}
          className={`w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60 ${success ? 'bg-accent-green text-white' : 'bg-accent-red text-white hover:opacity-90 shadow-glow-red'}`}>
          {success ? t('profile_saved') : loading ? '...' : t('save')}
        </button>
      </motion.div>
    </div>
  )
}
