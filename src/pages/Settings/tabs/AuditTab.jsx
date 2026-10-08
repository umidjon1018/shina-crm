import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, ChevronLeft, ChevronRight, Download, RefreshCw } from 'lucide-react'
import { getAuditLog } from '../../../api/auditService'
import { MONTHS_UZ, MONTHS_RU, formatDateTimeWithMonths, Badge, PAGE_SIZE } from '../apHelpers.jsx'
import { toast, errorText } from '../../../components/ui/Toast'

const GREEN = 'bg-accent-green/10 text-accent-green'
const RED = 'bg-accent-red/10 text-accent-red'
const BLUE = 'bg-accent-blue/10 text-accent-blue'
const ORANGE = 'bg-accent-orange/10 text-accent-orange'
const MUTED = 'bg-bg-tertiary text-text-muted'
const ACTION_COLORS = {
  audit_emp_added: GREEN, audit_emp_edited: BLUE, audit_emp_deactivated: RED, audit_emp_restored: GREEN,
  audit_emp_hard_deleted: RED, audit_emp_blocked: RED, audit_emp_unblocked: GREEN,
  audit_emp_delete_requested: ORANGE, audit_emp_delete_cancelled: MUTED,
  audit_device_approved: GREEN, audit_device_rejected: RED, audit_device_revoked: RED,
  audit_session_login: GREEN, audit_session_logout: MUTED, audit_page_visited: BLUE,
  audit_sale_cancelled: RED, audit_sale_edited: ORANGE, audit_return_edited: ORANGE,
  audit_price_changed: ORANGE, audit_product_deleted: RED, audit_expense_deleted: RED, audit_capital_deleted: RED,
  audit_shop_added: GREEN, audit_shop_edited: BLUE, audit_shop_deleted: RED,
  audit_branding_updated: BLUE, audit_loyalty_updated: BLUE, audit_roles_updated: BLUE, audit_business_settings_updated: BLUE,
  audit_discount_approved: GREEN, audit_discount_rejected: RED,
  audit_sale_created: GREEN, audit_used_sale_created: GREEN, audit_used_sale_cancelled: RED, audit_installment_paid: GREEN,
  audit_used_stock_added: BLUE, audit_return_created: ORANGE, audit_batch_created: BLUE, audit_supplier_paid: GREEN,
  audit_stock_transfer: BLUE, audit_expense_created: ORANGE, audit_expense_updated: ORANGE, audit_income_created: GREEN,
  audit_income_deleted: RED, audit_cash_expense: ORANGE, audit_capital_created: BLUE, audit_customer_created: GREEN,
  audit_customer_updated: BLUE, audit_customer_deleted: RED, audit_customer_merged: ORANGE, audit_balance_changed: BLUE,
  audit_product_created: GREEN, audit_writeoff_created: RED, audit_stocktake_started: BLUE, audit_stocktake_completed: GREEN,
  audit_order_created: BLUE, audit_order_received: GREEN, audit_supplier_return: ORANGE, audit_promo_created: GREEN,
  audit_promo_updated: BLUE, audit_promo_deleted: RED, audit_giftcard_sold: GREEN, audit_campaign_sent: BLUE,
  audit_reservation_created: BLUE, audit_reservation_cancelled: MUTED,
  audit_wh_client_created: GREEN, audit_wh_client_updated: BLUE, audit_wh_price_changed: ORANGE, audit_wh_sale: GREEN,
  audit_wh_consignment: BLUE, audit_wh_cons_settled: GREEN, audit_wh_cons_returned: ORANGE, audit_wh_return: RED, audit_wh_payment: GREEN,
  audit_prod_product_saved: BLUE, audit_prod_material_received: GREEN, audit_prod_material_adjusted: ORANGE, audit_prod_recipe_saved: BLUE,
  audit_fiscal_settings: BLUE,
  audit_prod_order_created: BLUE, audit_prod_order_done: GREEN, audit_prod_order_cancelled: MUTED,
}

function AuditTab() {
  const { t, i18n } = useTranslation()
  const MONTHS = i18n.language === 'ru' ? MONTHS_RU : MONTHS_UZ
  const formatDateTime = (d) => formatDateTimeWithMonths(d, MONTHS)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [filterUser, setFilterUser] = useState('all')
  const [filterAction, setFilterAction] = useState('all')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ rows: [], total: 0, users: [], keys: [] })
  const [loading, setLoading] = useState(false)

  const params = useCallback((extra = {}) => ({
    q: query || undefined,
    user: filterUser !== 'all' ? filterUser : undefined,
    key: filterAction !== 'all' ? filterAction : undefined,
    ...extra,
  }), [query, filterUser, filterAction])

  const load = useCallback(() => {
    setLoading(true)
    getAuditLog(params({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }))
      .then(setData)
      .catch(e => toast(errorText(e), 'error'))
      .finally(() => setLoading(false))
  }, [params, page])

  useEffect(() => { load() }, [load])
  // Qidiruv matni yozib bo'lingach so'rov yuboriladi
  useEffect(() => {
    const id = setTimeout(() => { setQuery(search.trim()); setPage(1) }, 400)
    return () => clearTimeout(id)
  }, [search])

  const ENTITY_LABELS = {
    employee: t('audit_entity_employee'), device: t('audit_entity_device'), settings: t('audit_entity_settings'),
    session: t('audit_entity_session'), page: t('audit_entity_page'), sale: t('audit_entity_sale'),
    return: t('audit_entity_return'), product: t('audit_entity_product'), expense: t('audit_entity_expense'),
    capital: t('audit_entity_capital'), shop: t('audit_entity_shop'), discount: t('audit_entity_discount'),
  }
  const actionLabel = (k) => (k && k.startsWith('audit_') ? t(k) : k)
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE))

  const exportCsv = async () => {
    try {
      const all = await getAuditLog(params({ limit: 500, offset: 0 }))
      const header = [t('col_time'), t('col_employee'), t('adm_audit_col_action'), t('adm_audit_col_entity'), t('adm_audit_col_detail')]
      const rows = all.rows.map(l => [formatDateTime(l.timestamp), l.userName || '', actionLabel(l.actionKey), ENTITY_LABELS[l.entity] || l.entity || '', l.details || ''])
      const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
      a.download = `audit_${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    } catch (e) { toast(errorText(e), 'error') }
  }

  const selectCls = 'bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red'

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-muted">{t('adm_audit_server_note')}</p>
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[180px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('adm_audit_search_placeholder')} className="w-full bg-bg-secondary border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
        </div>
        <select value={filterUser} onChange={e => { setFilterUser(e.target.value); setPage(1) }} className={selectCls}>
          <option value="all">{t('adm_audit_all_employees')}</option>
          {data.users.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1) }} className={selectCls}>
          <option value="all">{t('adm_audit_all_actions')}</option>
          {data.keys.map(a => <option key={a} value={a}>{actionLabel(a)}</option>)}
        </select>
        <button onClick={load} className="p-2 bg-bg-secondary border border-border rounded-xl text-text-secondary hover:text-text-primary" title="↻">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
        {data.total > 0 && (
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 bg-bg-secondary border border-border text-text-secondary text-sm font-semibold rounded-xl hover:bg-bg-tertiary transition-colors">
            <Download size={14} /> CSV
          </button>
        )}
      </div>

      <div className="bg-bg-secondary border border-border rounded-2xl overflow-x-auto">
        {data.rows.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-sm">
            {loading ? '…' : (query || filterUser !== 'all' || filterAction !== 'all') ? t('adm_audit_no_match') : t('adm_audit_empty')}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-tertiary">
              <tr>
                {[t('col_time'), t('col_employee'), t('adm_audit_col_action'), t('adm_audit_col_entity'), t('adm_audit_col_detail')].map(h => (
                  <th key={h} className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-text-muted uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.rows.map(l => (
                <tr key={l.id} className="hover:bg-bg-tertiary/20 transition-colors">
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs text-text-muted whitespace-nowrap">{formatDateTime(l.timestamp)}</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm font-semibold text-text-primary whitespace-nowrap">{l.userName || '—'}</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                    <Badge color={ACTION_COLORS[l.actionKey] || 'bg-bg-tertiary text-text-secondary'}>{actionLabel(l.actionKey)}</Badge>
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs text-text-muted">{l.entity ? (ENTITY_LABELS[l.entity] || l.entity) : '—'}</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs text-text-secondary min-w-[220px] [overflow-wrap:anywhere]">{l.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span className="text-xs text-text-muted">{Math.min(page * PAGE_SIZE, data.total)} / {data.total} ta</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 hover:bg-bg-tertiary rounded-lg disabled:opacity-40"><ChevronLeft size={16} /></button>
            <span className="font-semibold text-text-primary">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 hover:bg-bg-tertiary rounded-lg disabled:opacity-40"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditTab
