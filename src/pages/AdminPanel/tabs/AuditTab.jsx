import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence } from 'framer-motion'
import { Search, ChevronLeft, ChevronRight, AlertTriangle, Download } from 'lucide-react'
import { useAuditStore } from '../../../store/auditStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { MONTHS_UZ, MONTHS_RU, formatDateTimeWithMonths, Badge, ModalWrap, PAGE_SIZE } from '../apHelpers.jsx'

function AuditTab() {
  const { t, i18n } = useTranslation()
  const MONTHS = i18n.language === 'ru' ? MONTHS_RU : MONTHS_UZ
  const formatDateTime = (d) => formatDateTimeWithMonths(d, MONTHS)
  const { logs, clearLogs } = useAuditStore()
  const { employees } = useSettingsStore()
  const [search, setSearch] = useState('')
  const [filterUser, setFilterUser] = useState('all')
  const [filterAction, setFilterAction] = useState('all')
  const [page, setPage] = useState(1)
  const [showClear, setShowClear] = useState(false)

  const ENTITY_LABELS = {
    employee: t('audit_entity_employee'),
    device: t('audit_entity_device'),
    settings: t('audit_entity_settings'),
    session: t('audit_entity_session'),
    page: t('audit_entity_page'),
  }

  const allUsers = ['all', ...new Set(logs.map(l => l.userName).filter(Boolean))]
  const allActions = ['all', ...new Set(logs.map(l => l.actionKey || l.action).filter(Boolean))]

  const filtered = logs.filter(l => {
    if (filterUser !== 'all' && l.userName !== filterUser) return false
    if (filterAction !== 'all' && (l.actionKey || l.action) !== filterAction) return false
    if (search && !(l.details||'').toLowerCase().includes(search.toLowerCase()) && !(l.entity||'').toLowerCase().includes(search.toLowerCase()) && !(l.userName||'').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const ACTION_COLORS = {
    // actionKey-based (new logs)
    audit_emp_added:              'bg-accent-green/10 text-accent-green',
    audit_emp_edited:             'bg-accent-blue/10 text-accent-blue',
    audit_emp_deactivated:        'bg-accent-red/10 text-accent-red',
    audit_emp_restored:           'bg-accent-green/10 text-accent-green',
    audit_emp_hard_deleted:       'bg-accent-red/10 text-accent-red',
    audit_emp_edit_undone:        'bg-accent-orange/10 text-accent-orange',
    audit_emp_blocked:            'bg-accent-red/10 text-accent-red',
    audit_emp_unblocked:          'bg-accent-green/10 text-accent-green',
    audit_emp_edit_locked:        'bg-accent-red/10 text-accent-red',
    audit_emp_edit_unlocked:      'bg-accent-green/10 text-accent-green',
    audit_emp_delete_approved:    'bg-accent-red/10 text-accent-red',
    audit_emp_delete_cancelled:   'bg-bg-tertiary text-text-muted',
    audit_device_approved:        'bg-accent-green/10 text-accent-green',
    audit_device_rejected:        'bg-accent-red/10 text-accent-red',
    audit_trusted_device_deleted: 'bg-accent-orange/10 text-accent-orange',
    audit_login_history_cleared:  'bg-accent-orange/10 text-accent-orange',
    audit_face_id_deleted:        'bg-accent-orange/10 text-accent-orange',
    audit_session_login:          'bg-accent-green/10 text-accent-green',
    audit_session_logout:         'bg-bg-tertiary text-text-muted',
    audit_page_visited:           'bg-accent-blue/10 text-accent-blue',
    audit_role_added:             'bg-accent-green/10 text-accent-green',
    audit_role_deleted:           'bg-accent-red/10 text-accent-red',
    audit_ai_enabled:             'bg-accent-green/10 text-accent-green',
    audit_ai_disabled:            'bg-accent-red/10 text-accent-red',
    audit_ai_key_updated:         'bg-accent-blue/10 text-accent-blue',
    // backward compat — old Uzbek action strings
    'Xodim qo\'shildi':                          'bg-accent-green/10 text-accent-green',
    'Xodim tahrirlandi':                          'bg-accent-blue/10 text-accent-blue',
    'Xodim deaktivlandi':                         'bg-accent-red/10 text-accent-red',
    'Xodim qaytarildi':                           'bg-accent-green/10 text-accent-green',
    "Xodim butunlay o'chirildi":                  'bg-accent-red/10 text-accent-red',
    "Xodim tahriri bekor qilindi":                'bg-accent-orange/10 text-accent-orange',
    'Xodim Admin tomonidan bloklandi':            'bg-accent-red/10 text-accent-red',
    'Xodim blokdan chiqarildi (Admin)':           'bg-accent-green/10 text-accent-green',
    "Xodimlarni tahrirlash/o'chirish bloklandi":  'bg-accent-red/10 text-accent-red',
    "Xodimlarni tahrirlash/o'chirish blokdan chiqarildi": 'bg-accent-green/10 text-accent-green',
    'Qurilma tasdiqlandi':                        'bg-accent-green/10 text-accent-green',
    'Qurilma rad etildi':                         'bg-accent-red/10 text-accent-red',
    "Ishonchli qurilma o'chirildi":               'bg-accent-orange/10 text-accent-orange',
    'Kirish tarixi tozalandi':                    'bg-accent-orange/10 text-accent-orange',
    "Yuz ID o'chirildi":                          'bg-accent-orange/10 text-accent-orange',
    'Tizimga kirdi (online)':                     'bg-accent-green/10 text-accent-green',
    'Tizimdan chiqdi (offline)':                  'bg-bg-tertiary text-text-muted',
    'Sahifaga kirildi':                           'bg-accent-blue/10 text-accent-blue',
    "Do'kon qo'shildi":                           'bg-accent-green/10 text-accent-green',
    "Do'kon tahrirlandi":                         'bg-accent-blue/10 text-accent-blue',
    "Do'kon o'chirildi":                          'bg-accent-red/10 text-accent-red',
    "Aksiya qo'shildi":                           'bg-accent-green/10 text-accent-green',
    'Aksiya tahrirlandi':                         'bg-accent-blue/10 text-accent-blue',
    "Aksiya o'chirildi":                          'bg-accent-red/10 text-accent-red',
    'Aksiya faollashtirildi':                     'bg-accent-green/10 text-accent-green',
    'Aksiya nofaol qilindi':                      'bg-accent-orange/10 text-accent-orange',
    'AI Agent yoqildi':                           'bg-accent-green/10 text-accent-green',
    "AI Agent o'chirildi":                        'bg-accent-red/10 text-accent-red',
    'AI API kaliti yangilandi':                   'bg-accent-blue/10 text-accent-blue',
    'Rol ruxsatlari yangilandi':                  'bg-accent-blue/10 text-accent-blue',
    'Ruxsatlar yangilandi':                       'bg-accent-blue/10 text-accent-blue',
  }

  const exportCsv = () => {
    const header = [t('col_time'), t('col_employee'), t('adm_audit_col_action'), t('adm_audit_col_entity'), t('adm_audit_col_detail')]
    const rows = filtered.map(l => [
      formatDateTime(l.timestamp), l.userName || '', l.action || '', l.entity || '', l.details || ''
    ])
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `audit_${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[180px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder={t('adm_audit_search_placeholder')} className="w-full bg-bg-secondary border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
        </div>
        <select value={filterUser} onChange={e=>{setFilterUser(e.target.value);setPage(1)}} className="bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red">
          <option value="all">{t('adm_audit_all_employees')}</option>
          {allUsers.filter(u=>u!=='all').map(u=><option key={u} value={u}>{u}</option>)}
        </select>
        <select value={filterAction} onChange={e=>{setFilterAction(e.target.value);setPage(1)}} className="bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red">
          <option value="all">{t('adm_audit_all_actions')}</option>
          {allActions.filter(a=>a!=='all').map(a=><option key={a} value={a}>{a.startsWith('audit_') ? t(a) : a}</option>)}
        </select>
        {filtered.length > 0 && (
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 bg-bg-secondary border border-border text-text-secondary text-sm font-semibold rounded-xl hover:bg-bg-tertiary transition-colors">
            <Download size={14}/> CSV
          </button>
        )}
        {logs.length > 0 && (
          <button onClick={()=>setShowClear(true)} className="px-3 py-2 bg-accent-red/10 text-accent-red text-sm font-semibold rounded-xl hover:bg-accent-red/20 transition-colors border border-accent-red/20">
            {t('adm_dev_clear')}
          </button>
        )}
      </div>

      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
        {paginated.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-sm">
            {logs.length === 0 ? t('adm_audit_empty') : t('adm_audit_no_match')}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-tertiary">
              <tr>
                {[t('col_time'), t('col_employee'), t('adm_audit_col_action'), t('adm_audit_col_entity'), t('adm_audit_col_detail')].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-text-muted uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.map(l => (
                <tr key={l.id} className="hover:bg-bg-tertiary/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">{formatDateTime(l.timestamp)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-text-primary whitespace-nowrap">{l.userName || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge color={ACTION_COLORS[l.actionKey] || ACTION_COLORS[l.action] || 'bg-bg-tertiary text-text-secondary'}>{l.actionKey ? t(l.actionKey) : l.action}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">{l.entity ? (ENTITY_LABELS[l.entity] || l.entity) : '—'}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary max-w-[200px] truncate">{l.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span className="text-xs text-text-muted">{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} ta</span>
          <div className="flex items-center gap-2">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="p-1.5 hover:bg-bg-tertiary rounded-lg disabled:opacity-40"><ChevronLeft size={16}/></button>
            <span className="font-semibold text-text-primary">{page} / {totalPages}</span>
            <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="p-1.5 hover:bg-bg-tertiary rounded-lg disabled:opacity-40"><ChevronRight size={16}/></button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showClear && (
          <ModalWrap onClose={()=>setShowClear(false)} maxW="max-w-sm">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-accent-red/10 rounded-2xl flex items-center justify-center mx-auto"><AlertTriangle size={28} className="text-accent-red" /></div>
              <div>
                <h3 className="font-syne font-bold text-lg">{t('adm_audit_clear_title')}</h3>
                <p className="text-text-secondary text-sm mt-1">{logs.length} {t('adm_audit_clear_confirm')}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setShowClear(false)} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm">{t('cancel')}</button>
                <button onClick={()=>{clearLogs();setShowClear(false)}} className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm">{t('adm_audit_clear_btn')}</button>
              </div>
            </div>
          </ModalWrap>
        )}
      </AnimatePresence>
    </div>
  )
}


export default AuditTab
