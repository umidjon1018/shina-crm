import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence } from 'framer-motion'
import { AlertTriangle, Archive, ArchiveRestore, CheckSquare, Eye, EyeOff, Lock, Pencil, Plus, Search, Shield, ShieldAlert, Trash2, Unlock, X, XSquare } from 'lucide-react'
import { useSettingsStore } from '../../../store/settingsStore'
import { useAuthStore } from '../../../store/authStore'
import { useAuditStore } from '../../../store/auditStore'
import { useShopStore } from '../../../store/shopStore'
import { MONTHS_UZ, MONTHS_RU, formatDateWithMonths, formatDateTimeWithMonths, ROLE_LABELS_KEYS, ALL_PERMISSION_KEYS, ROLE_PERMISSIONS, Badge, ModalWrap } from '../apHelpers.jsx'
import RoleAccessSection from '../components/RoleAccessSection'
import PermissionTree from '../../../components/PermissionTree'
import { PERMISSION_TREE } from '../../../config/permissionTree'

function EmployeesTab() {
  const { t, i18n } = useTranslation()
  const MONTHS = i18n.language === 'ru' ? MONTHS_RU : MONTHS_UZ
  const formatDate = (d) => formatDateWithMonths(d, MONTHS)
  const formatDateTime = (d) => formatDateTimeWithMonths(d, MONTHS)
  const { shops } = useShopStore()
  const {
    employees, addEmployee, updateEmployee, removeEmployee,
    restoreEmployee, permanentlyDeleteEmployee,
    employeeEditLocked, toggleEmployeeEditLocked,
    approveEmployeeDeletion, cancelEmployeeDeletion, requestEmployeeDeletion,
    customRoles, roleAccessTrees, roleDeniedNodes,
  } = useSettingsStore()
  const ROLE_LABELS = Object.fromEntries(Object.entries(ROLE_LABELS_KEYS).map(([k, v]) => [k, t(v)]))
  const roleLabels = { ...ROLE_LABELS, ...Object.fromEntries((customRoles||[]).map(r => [r.id, r.label])) }
  const { user: me, updateAdminProfile } = useAuthStore()
  const isAdmin = me?.role === 'admin'
  // Boshqaruvchi admin va boshqaruvchilarni o'zgartira olmaydi; admin qulflagan bo'lsa — hech kimni
  const canEditEmp = (emp) => isAdmin || (!employeeEditLocked && !['admin', 'manager'].includes(emp.role))
  const { addLog } = useAuditStore()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [showPass, setShowPass] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [hardDeleteTarget, setHardDeleteTarget] = useState(null)
  const [form, setForm] = useState({ name:'', phone:'+998', role:'seller', hiredAt:'', salary:'', username:'', password:'', permissions: ROLE_PERMISSIONS['seller'], access: null })
  const [hiredAtDisplay, setHiredAtDisplay] = useState('')
  const [saveError, setSaveError] = useState('')

  const activeEmployees = [
    ...(me ? [{ id: String(me.id), name: me.fullName || me.username, phone: '', role: me.role, isActive: true, username: me.username, permissions: me.permissions }] : []),
    ...employees.filter(e => e.isActive !== false && e.username !== me?.username)
  ]
  const deletedEmployees = employees.filter(e => e.isActive === false)
  const filtered = activeEmployees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.username||'').toLowerCase().includes(search.toLowerCase()) ||
    (e.phone||'').includes(search)
  )


  const restore = (emp) => {
    restoreEmployee(emp.id)
    addLog({ userId: me?.id, userName: me?.fullName || me?.username, action: 'Xodim qaytarildi', actionKey: 'audit_emp_restored', entity: 'employee', details: emp.name })
  }
  const hardDelete = (emp) => {
    permanentlyDeleteEmployee(emp.id)
    addLog({ userId: me?.id, userName: me?.fullName || me?.username, action: "Xodim butunlay o'chirildi", actionKey: 'audit_emp_hard_deleted', entity: 'employee', details: emp.name })
    setHardDeleteTarget(null)
  }

  const isoToDisplay = (iso) => {
    if (!iso) return ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const [y, m, d] = iso.split('-')
      return `${d}.${m}.${y}`
    }
    const dt = new Date(iso)
    if (!isNaN(dt.getTime())) {
      const d = String(dt.getUTCDate()).padStart(2,'0')
      const m = String(dt.getUTCMonth()+1).padStart(2,'0')
      const y = dt.getUTCFullYear()
      return `${d}.${m}.${y}`
    }
    return ''
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ name:'', phone:'+998', role:'seller', hiredAt:'', salary:'', username:'', password:'', permissions: ROLE_PERMISSIONS['seller'], shopId: '', access: null })
    setHiredAtDisplay('')
    setSaveError('')
    setShowPass(false)
    setShowModal(true)
  }
  const openEdit = (emp) => {
    setEditing(emp)
    setForm({ name: emp.name, phone: emp.phone||'', role: emp.role, hiredAt: emp.hiredAt||'', salary: emp.salary ? String(emp.salary) : '', username: emp.username||'', password: '', permissions: emp.permissions||[], shopId: emp.shopId||'', access: emp.access || null })
    setHiredAtDisplay(isoToDisplay(emp.hiredAt||''))
    setSaveError('')
    setShowPass(false)
    setShowModal(true)
  }
  const save = async () => {
    if (!form.name.trim() || !form.username.trim()) return
    if (editing) {
      if (editing.role === 'admin') {
        const res = await updateAdminProfile({ full_name: form.name, username: form.username, password: form.password || undefined })
        if (!res.success) return
      } else {
        updateEmployee(editing.id, { ...form, salary: Number(form.salary) || 0 })
      }
      addLog({ userId: me?.id, userName: me?.fullName || me?.username, action: 'Xodim tahrirlandi', actionKey: 'audit_emp_edited', entity: 'employee', details: form.name })
    } else {
      try {
        await addEmployee({ ...form, salary: Number(form.salary) || 0 })
        addLog({ userId: me?.id, userName: me?.fullName || me?.username, action: 'Xodim qo\'shildi', actionKey: 'audit_emp_added', entity: 'employee', details: form.name })
      } catch (e) {
        setSaveError(e?.response?.data?.error || e?.message || 'Noma\'lum xato')
        return
      }
    }
    setShowModal(false)
  }
  const deactivate = (emp) => {
    if (!isAdmin) { requestEmployeeDeletion(emp.id); setDeleteTarget(null); return }
    removeEmployee(emp.id)
    addLog({ userId: me?.id, userName: me?.fullName || me?.username, action: 'Xodim deaktivlandi', actionKey: 'audit_emp_deactivated', entity: 'employee', details: emp.name })
    setDeleteTarget(null)
  }
  const toggleBlock = (emp) => {
    const willBlock = !emp.isBlocked
    updateEmployee(emp.id, { isBlocked: willBlock })
    addLog({
      userId: me?.id, userName: me?.fullName || me?.username,
      action: willBlock ? 'Xodim Admin tomonidan bloklandi' : 'Xodim blokdan chiqarildi (Admin)',
      actionKey: willBlock ? 'audit_emp_blocked' : 'audit_emp_unblocked',
      entity: 'employee', details: emp.name
    })
  }

  const ALL_PERMISSIONS = ALL_PERMISSION_KEYS.map(p => ({ key: p.key, label: t(p.labelKey) }))

  return (
    <div className="space-y-3 sm:space-y-5">
      {isAdmin && <RoleAccessSection />}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('adm_emp_search_placeholder')}
            className="w-full bg-bg-secondary border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
        </div>
        {isAdmin && <button
          onClick={() => {
            toggleEmployeeEditLocked()
            addLog({
              userId: me?.id, userName: me?.fullName || me?.username,
              action: !employeeEditLocked ? "Xodimlarni tahrirlash/o'chirish bloklandi" : "Xodimlarni tahrirlash/o'chirish blokdan chiqarildi",
              actionKey: !employeeEditLocked ? 'audit_emp_edit_locked' : 'audit_emp_edit_unlocked',
              entity: 'employee', details: 'Boshqaruvchilar uchun'
            })
          }}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${employeeEditLocked ? 'bg-accent-red/10 text-accent-red border-accent-red/20 hover:bg-accent-red/20' : 'bg-bg-secondary border-border text-text-secondary hover:bg-bg-tertiary'}`}
          title={t('adm_emp_lock_hint')}
        >
          {employeeEditLocked ? <Lock size={16} /> : <Unlock size={16} />}
          {employeeEditLocked ? t('adm_emp_edit_locked') : t('adm_emp_edit_allowed')}
        </button>}
        {(isAdmin || !employeeEditLocked) && <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2.5 bg-accent-red text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-glow-red">
          <Plus size={16} /> {t('adm_emp_add')}
        </button>}
      </div>
      {employeeEditLocked && (
        <p className="text-xs text-accent-red font-medium -mt-2">
          {t('adm_emp_locked_note')}
        </p>
      )}

      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-tertiary">
            <tr>
              {[t('adm_emp_col_name'), t('adm_field_role'), t('adm_emp_col_username'), t('col_phone'), t('adm_emp_col_joined'), t('col_status'), t('adm_emp_col_action')].map(h => (
                <th key={h} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] font-bold text-text-muted uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(emp => (
              <tr key={emp.id} className={`hover:bg-bg-tertiary/30 transition-colors ${!emp.isActive ? 'opacity-50' : ''}`}>
                <td className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-text-primary">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-accent-red/10 text-accent-red flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {emp.name?.[0]?.toUpperCase()}
                    </div>
                    {emp.name}
                  </div>
                </td>
                <td className="px-3 sm:px-4 py-2 sm:py-3"><Badge color="bg-accent-blue/10 text-accent-blue">{roleLabels[emp.role] || emp.role}</Badge></td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-mono text-xs">{emp.username || '—'}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-secondary text-xs">{emp.phone || '—'}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted text-xs">{emp.createdAt ? formatDate(emp.createdAt) : '—'}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3">
                  <div className="flex items-center gap-1.5">
                    {emp.isActive !== false
                      ? <Badge color="bg-accent-green/10 text-accent-green">{t('adm_emp_status_active')}</Badge>
                      : <Badge color="bg-bg-tertiary text-text-muted">{t('adm_emp_status_inactive')}</Badge>}
                    {emp.isBlocked && <Badge color="bg-accent-red/10 text-accent-red">{t('emp_status_blocked')}</Badge>}
                  </div>
                </td>
                <td className="px-3 sm:px-4 py-2 sm:py-3">
                  <div className="flex items-center gap-1">
                    {emp.role !== 'admin' && canEditEmp(emp) && !(emp.blockedByAdmin && !isAdmin) && (
                      <button onClick={() => toggleBlock(emp)}
                        className={`p-1.5 rounded-lg transition-colors ${emp.isBlocked ? 'bg-accent-red/10 text-accent-red hover:bg-accent-red/20' : 'text-text-muted hover:bg-bg-tertiary hover:text-accent-orange'}`}
                        title={emp.isBlocked ? t('adm_emp_unblock') : t('adm_emp_block')}>
                        {emp.isBlocked ? <ShieldAlert size={14} /> : <Shield size={14} />}
                      </button>
                    )}
                    {canEditEmp(emp) && <button onClick={() => openEdit(emp)} className="p-1.5 hover:bg-bg-tertiary rounded-lg text-text-muted hover:text-text-primary transition-colors"><Pencil size={14} /></button>}
                    {emp.role !== 'admin' && emp.isActive !== false && !emp.pendingDelete && canEditEmp(emp) && (
                      <button onClick={() => setDeleteTarget(emp)} className="p-1.5 hover:bg-accent-red/10 rounded-lg text-text-muted hover:text-accent-red transition-colors"><Trash2 size={14} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-muted text-sm">{t('adm_emp_not_found')}</div>
        )}
      </div>

      {employees.filter(e => e.pendingDelete).length > 0 && (
        <div className="bg-bg-secondary border border-accent-orange/30 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <AlertTriangle size={16} className="text-accent-orange" />
            <h3 className="font-syne font-bold text-text-primary text-sm">{t('adm_delete_requests')}</h3>
            <Badge color="bg-accent-orange/10 text-accent-orange">{employees.filter(e => e.pendingDelete).length}</Badge>
          </div>
          <div className="divide-y divide-border">
            {employees.filter(e => e.pendingDelete).map(emp => (
              <div key={emp.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary font-semibold">{emp.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {roleLabels[emp.role] || emp.role} • {emp.phone || '—'} • {t('col_time')}: {emp.pendingDeleteAt ? formatDateTime(emp.pendingDeleteAt) : '—'}
                  </p>
                </div>
                {isAdmin && <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => {
                    approveEmployeeDeletion(emp.id)
                    addLog({ userId: me?.id, userName: me?.fullName || me?.username, action: "Boshqaruvchi o'chirish so'rovi tasdiqlandi", actionKey: 'audit_emp_delete_approved', entity: 'employee', details: emp.name })
                  }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-accent-red/30 text-accent-red hover:bg-accent-red/10 transition-colors">
                    <CheckSquare size={13} /> {t('confirm')}
                  </button>
                  <button onClick={() => {
                    cancelEmployeeDeletion(emp.id)
                    addLog({ userId: me?.id, userName: me?.fullName || me?.username, action: "Boshqaruvchi o'chirish so'rovi bekor qilindi", actionKey: 'audit_emp_delete_cancelled', entity: 'employee', details: emp.name })
                  }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border text-text-secondary hover:bg-bg-tertiary transition-colors">
                    <XSquare size={13} /> {t('adm_delete_cancel')}
                  </button>
                </div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && deletedEmployees.length > 0 && (
        <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Archive size={16} className="text-text-muted" />
            <h3 className="font-syne font-bold text-text-primary text-sm">{t('adm_deleted_employees')}</h3>
          </div>
          <div className="divide-y divide-border">
            {deletedEmployees.map(emp => (
              <div key={emp.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary font-semibold">{emp.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {roleLabels[emp.role] || emp.role} • {emp.phone || '—'} • {t('adm_deleted_at')}: {emp.deactivatedAt ? formatDateTime(emp.deactivatedAt) : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => restore(emp)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-accent-green/30 text-accent-green hover:bg-accent-green/10 transition-colors">
                    <ArchiveRestore size={13} /> {t('adm_emp_restore')}
                  </button>
                  <button onClick={() => setHardDeleteTarget(emp)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-accent-red/30 text-accent-red hover:bg-accent-red/10 transition-colors">
                    <Trash2 size={13} /> {t('adm_emp_hard_delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <ModalWrap onClose={() => setShowModal(false)}>
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
              <h3 className="font-syne font-bold text-lg">{editing ? t('adm_modal_edit_title') : t('adm_modal_add_title')}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-bg-tertiary rounded-lg"><X size={18} className="text-text-secondary" /></button>
            </div>
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">{t('adm_field_name')} *</label>
                  <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">{t('col_phone')}</label>
                  <input value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} placeholder="+998901234567" className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
                </div>
              </div>
              {editing?.role !== 'admin' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">{t('adm_field_role')}</label>
                      <select value={form.role} onChange={e => { const r = e.target.value; setForm(f=>({...f, role:r, permissions: ROLE_PERMISSIONS[r]||[]})) }}
                        className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red">
                        {Object.entries(roleLabels).filter(([k])=>k!=='admin' && (isAdmin || k!=='manager')).map(([k,v])=>(
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">{t('adm_field_hired_at')}</label>
                      <input
                        type="text"
                        value={hiredAtDisplay}
                        onChange={e => {
                          const prev = hiredAtDisplay.replace(/\D/g,'')
                          const next = e.target.value.replace(/\D/g,'')
                          // backspace bosilsa ham to'g'ri ishlaydi chunki raw digits bilan ishlaymiz
                          const raw = next.slice(0,8)
                          const d = raw.slice(0,2)
                          const m = raw.slice(2,4)
                          const y = raw.slice(4,8)
                          let display = d
                          if (raw.length >= 2) display += '.' + m
                          if (raw.length >= 4) display += '.' + y
                          setHiredAtDisplay(display)
                          if (raw.length === 8) {
                            setForm(f => ({ ...f, hiredAt: `${y}-${m}-${d}` }))
                          } else {
                            setForm(f => ({ ...f, hiredAt: '' }))
                          }
                        }}
                        placeholder="kk.oo.yyyy"
                        maxLength={10}
                        className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">{t('adm_field_salary')}</label>
                    <input type="number" value={form.salary} onChange={e=>setForm(f=>({...f,salary:e.target.value}))} min="0" className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">{t('mgmt_tab_shops')}</label>
                    <select value={form.shopId||''} onChange={e=>setForm(f=>({...f,shopId:e.target.value}))}
                      className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red">
                      <option value="">{t('all_shops')}</option>
                      {shops.filter(s=>s.isActive).map(s=>(
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">{t('adm_field_username')} *</label>
                  <input value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red font-mono" />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">
                    {t('password')}{editing ? <span className="ml-1 text-text-muted/60">(bo'sh = o'zgarmaydi)</span> : ' *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                      placeholder={editing ? '••••••••' : ''}
                      className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 pr-9 text-sm text-text-primary focus:outline-none focus:border-accent-red font-mono"
                    />
                    <button type="button" onClick={()=>setShowPass(!showPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                      {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>
                </div>
              </div>
              {isAdmin && editing?.role !== 'admin' && (
                <div className="space-y-2">
                  <label className="text-xs text-text-muted block font-semibold">{t('adm_field_permissions')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[[false, t('adm_access_by_role')], [true, t('adm_access_individual')]].map(([ind, label]) => (
                      <button type="button" key={String(ind)}
                        onClick={() => setForm(f => ({ ...f, access: ind
                          ? (f.access || { checked: [...(roleAccessTrees?.[f.role] || [])], denied: [...(roleDeniedNodes?.[f.role] || [])] })
                          : null }))}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${!!form.access === ind ? 'bg-accent-blue/10 border-accent-blue/40 text-accent-blue' : 'bg-bg-tertiary border-border text-text-muted'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-text-muted">{form.access ? t('adm_access_individual_hint') : t('adm_access_by_role_hint', { role: roleLabels[form.role] || form.role })}</p>
                  {form.access && (
                    <div className="bg-bg-tertiary border border-border rounded-xl p-3 max-h-72 overflow-y-auto no-scrollbar">
                      <PermissionTree
                        tree={PERMISSION_TREE}
                        checked={form.access.checked || []}
                        onChange={(ids) => setForm(f => ({ ...f, access: { ...f.access, checked: ids } }))}
                        denied={form.access.denied || []}
                        onDeniedChange={(ids) => setForm(f => ({ ...f, access: { ...f.access, denied: ids } }))}
                        ceiling={null}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            {saveError && (
              <div className="mx-5 mb-2 px-3 py-2 bg-accent-red/10 border border-accent-red/20 rounded-xl text-accent-red text-xs">
                {saveError}
              </div>
            )}
            <div className="flex gap-3 p-4 sm:p-5 border-t border-border">
              <button onClick={()=>setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-bg-tertiary text-sm">{t('cancel')}</button>
              <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm hover:opacity-90 shadow-glow-red">
                {editing ? t('save') : t('add')}
              </button>
            </div>
          </ModalWrap>
        )}
        {deleteTarget && (
          <ModalWrap onClose={()=>setDeleteTarget(null)} maxW="max-w-sm">
            <div className="p-4 sm:p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-accent-red/10 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle size={28} className="text-accent-red" />
              </div>
              <div>
                <h3 className="font-syne font-bold text-lg text-text-primary">{t('adm_deactivate_title')}</h3>
                <p className="text-text-secondary text-sm mt-1"><span className="font-bold text-text-primary">{deleteTarget.name}</span> {t('adm_deactivate_confirm')}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm">{t('cancel')}</button>
                <button onClick={()=>deactivate(deleteTarget)} className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm hover:opacity-90">{t('adm_deactivate_btn')}</button>
              </div>
            </div>
          </ModalWrap>
        )}
        {hardDeleteTarget && (
          <ModalWrap onClose={()=>setHardDeleteTarget(null)} maxW="max-w-sm">
            <div className="p-4 sm:p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-accent-red/10 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle size={28} className="text-accent-red" />
              </div>
              <div>
                <h3 className="font-syne font-bold text-lg text-text-primary">{t('adm_hard_delete_title')}</h3>
                <p className="text-text-secondary text-sm mt-1">
                  <span className="font-bold text-text-primary">{hardDeleteTarget.name}</span> {t('adm_hard_delete_confirm')}
                  {' '}{t('adm_hard_delete_warning')}
                </p>
                <p className="text-text-muted text-xs mt-2">
                  {t('adm_hard_delete_note')}
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setHardDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm">{t('cancel')}</button>
                <button onClick={()=>hardDelete(hardDeleteTarget)} className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm hover:opacity-90">{t('adm_hard_delete_btn')}</button>
              </div>
            </div>
          </ModalWrap>
        )}
      </AnimatePresence>
    </div>
  )
}


export default EmployeesTab
