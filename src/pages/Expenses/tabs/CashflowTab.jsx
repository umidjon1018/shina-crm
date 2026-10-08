import React, { useState, useEffect, useMemo } from 'react'
import TableView from '../../../components/ui/TableView'
import { ArrowDownLeft, ArrowUpRight, Banknote, CreditCard, Landmark, RefreshCw, Search, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useShopStore } from '../../../store/shopStore'
import { useDataStore } from '../../../store/dataStore'
import { getCashflow } from '../../../api/financeService'
import { useFinanceCategories } from '../components/useFinanceCategories'
import { fmtUZS, getCatLabel, PAGE_SIZE, Pagination, pmLabel } from '../components/expHelpers'
import PeriodPicker, { presetRange } from '../components/PeriodPicker'

const ACCOUNTS = [
  { id: 'cash', icon: Banknote, cls: 'bg-emerald-500/10 text-emerald-500' },
  { id: 'card', icon: CreditCard, cls: 'bg-blue-500/10 text-blue-500' },
  { id: 'transfer', icon: Landmark, cls: 'bg-purple-500/10 text-purple-500' },
]

const fmtTs = (ts) => {
  if (!ts) return ''
  const [d, tm] = ts.split(' ')
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}${tm && tm !== '00:00' ? ' ' + tm : ''}`
}

const CashflowTab = () => {
  const { t } = useTranslation()
  const { selectedShopId } = useShopStore()
  const { version } = useDataStore()
  const { categories } = useFinanceCategories()
  const [preset, setPreset] = useState('month')
  const [range, setRange] = useState(presetRange('month'))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [method, setMethod] = useState('all')
  const [dir, setDir] = useState('all')
  const [kind, setKind] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const load = () => {
    setLoading(true); setError('')
    getCashflow({ ...range, shopId: selectedShopId })
      .then(d => { setData(d); setPage(1) })
      .catch(e => setError(e?.response?.data?.error || t('exp_err_generic')))
      .finally(() => setLoading(false))
  }
  useEffect(load, [range.from, range.to, selectedShopId, version])

  const kindLabel = (k) => t('fin_kind_' + k)
  const rowNote = (r) => {
    if (r.kind === 'expense' || r.kind === 'cash_expense' || r.kind === 'other_income') {
      const cat = categories.find(c => c.id === r.ref)
      return [cat ? getCatLabel(cat, t) : null, r.note].filter(Boolean).join(' · ')
    }
    if (['sale', 'installment_down', 'installment_payment', 'used_sale', 'refund', 'exchange_payment'].includes(r.kind)) {
      return [`#${r.ref}`, r.note].filter(Boolean).join(' · ')
    }
    return r.note
  }

  const rows = useMemo(() => {
    if (!data) return []
    let l = data.rows
    if (method !== 'all') l = l.filter(r => r.method === method)
    if (dir !== 'all') l = l.filter(r => r.dir === dir)
    if (kind !== 'all') l = l.filter(r => r.kind === kind)
    if (search.trim()) {
      const q = search.toLowerCase()
      l = l.filter(r => (rowNote(r) || '').toLowerCase().includes(q) || (r.who || '').toLowerCase().includes(q) || kindLabel(r.kind).toLowerCase().includes(q))
    }
    return l
  }, [data, method, dir, kind, search, categories])

  const kinds = useMemo(() => (data?.byKind || []).map(k => k.kind), [data])
  const sum = (o) => (o ? o.cash + o.card + o.transfer : 0)
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const paginated = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const selectCls = 'bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red cursor-pointer'

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <PeriodPicker preset={preset} range={range} onChange={(p, r) => { setPreset(p); setRange(r) }} />
        <button onClick={load} className="p-2.5 rounded-xl border border-border bg-bg-secondary text-text-secondary hover:text-text-primary">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && <div className="text-sm text-accent-red bg-accent-red/10 px-4 py-3 rounded-xl">{error}</div>}

      {data && (
        <>
          {/* Hisoblar bo'yicha qoldiq */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {ACCOUNTS.map(a => {
              const Icon = a.icon
              return (
                <button key={a.id} onClick={() => { setMethod(method === a.id ? 'all' : a.id); setPage(1) }}
                  className={`text-left bg-bg-secondary border rounded-2xl p-4 transition-all ${method === a.id ? 'border-accent-red' : 'border-border hover:border-accent-red/40'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${a.cls}`}><Icon size={18} /></div>
                    <span className="font-semibold text-text-primary text-sm">{pmLabel(a.id, t)}</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between gap-2"><span className="text-text-muted">{t('fin_cf_opening')}</span><span className="text-text-secondary">{fmtUZS(data.opening[a.id])}</span></div>
                    <div className="flex justify-between gap-2"><span className="text-text-muted">{t('fin_cf_in')}</span><span className="text-accent-green">+{fmtUZS(data.in[a.id])}</span></div>
                    <div className="flex justify-between gap-2"><span className="text-text-muted">{t('fin_cf_out')}</span><span className="text-accent-red">−{fmtUZS(data.out[a.id])}</span></div>
                  </div>
                  <div className="flex justify-between gap-2 mt-2 pt-2 border-t border-border">
                    <span className="text-text-secondary text-xs font-semibold">{t('fin_cf_closing')}</span>
                    <span className={`font-bold text-sm ${data.closing[a.id] < 0 ? 'text-accent-red' : 'text-text-primary'}`}>{fmtUZS(data.closing[a.id])}</span>
                  </div>
                </button>
              )
            })}
            <div className="bg-bg-secondary border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-accent-red/10 text-accent-red"><Wallet size={18} /></div>
                <span className="font-semibold text-text-primary text-sm">{t('fin_cf_total')}</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between gap-2"><span className="text-text-muted">{t('fin_cf_opening')}</span><span className="text-text-secondary">{fmtUZS(sum(data.opening))}</span></div>
                <div className="flex justify-between gap-2"><span className="text-text-muted">{t('fin_cf_in')}</span><span className="text-accent-green">+{fmtUZS(sum(data.in))}</span></div>
                <div className="flex justify-between gap-2"><span className="text-text-muted">{t('fin_cf_out')}</span><span className="text-accent-red">−{fmtUZS(sum(data.out))}</span></div>
              </div>
              <div className="flex justify-between gap-2 mt-2 pt-2 border-t border-border">
                <span className="text-text-secondary text-xs font-semibold">{t('fin_cf_net')}</span>
                <span className={`font-bold text-sm ${sum(data.in) - sum(data.out) < 0 ? 'text-accent-red' : 'text-accent-green'}`}>{fmtUZS(sum(data.in) - sum(data.out))}</span>
              </div>
            </div>
          </div>

          {/* Turlar bo'yicha */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {['in', 'out'].map(d => {
              const list = data.byKind.filter(k => k.dir === d).sort((a, b) => b.total - a.total)
              const tot = list.reduce((s, k) => s + k.total, 0)
              return (
                <div key={d} className="bg-bg-secondary border border-border rounded-2xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h3 className="font-syne font-bold text-sm text-text-primary flex items-center gap-2">
                      {d === 'in' ? <ArrowDownLeft size={16} className="text-accent-green" /> : <ArrowUpRight size={16} className="text-accent-red" />}
                      {d === 'in' ? t('fin_cf_in_by_kind') : t('fin_cf_out_by_kind')}
                    </h3>
                    <span className={`text-sm font-bold ${d === 'in' ? 'text-accent-green' : 'text-accent-red'}`}>{fmtUZS(tot)}</span>
                  </div>
                  {list.length === 0 ? <p className="text-text-muted text-xs">—</p> : (
                    <div className="space-y-2">
                      {list.map(k => (
                        <button key={k.kind} onClick={() => { setKind(kind === k.kind ? 'all' : k.kind); setPage(1) }}
                          className={`w-full text-left rounded-lg px-2 py-1.5 transition-colors ${kind === k.kind ? 'bg-accent-red/10' : 'hover:bg-bg-tertiary'}`}>
                          <div className="flex items-center justify-between text-xs gap-2">
                            <span className="text-text-secondary truncate">{kindLabel(k.kind)} <span className="text-text-muted">· {k.count}</span></span>
                            <span className="text-text-primary font-semibold whitespace-nowrap">{fmtUZS(k.total)}</span>
                          </div>
                          <div className="h-1.5 bg-bg-tertiary rounded-full mt-1 overflow-hidden">
                            <div className={`h-full rounded-full ${d === 'in' ? 'bg-accent-green' : 'bg-accent-red'}`} style={{ width: `${tot ? Math.max(2, (k.total / tot) * 100) : 0}%` }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Filtrlar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder={t('fin_cf_search_ph')}
                className="w-full bg-bg-secondary border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
            </div>
            <select value={dir} onChange={e => { setDir(e.target.value); setPage(1) }} className={selectCls}>
              <option value="all">{t('fin_cf_all_dirs')}</option>
              <option value="in">{t('fin_cf_in')}</option>
              <option value="out">{t('fin_cf_out')}</option>
            </select>
            <select value={method} onChange={e => { setMethod(e.target.value); setPage(1) }} className={selectCls}>
              <option value="all">{t('fin_cf_all_accounts')}</option>
              {ACCOUNTS.map(a => <option key={a.id} value={a.id}>{pmLabel(a.id, t)}</option>)}
            </select>
            <select value={kind} onChange={e => { setKind(e.target.value); setPage(1) }} className={selectCls}>
              <option value="all">{t('fin_cf_all_kinds')}</option>
              {kinds.map(k => <option key={k} value={k}>{kindLabel(k)}</option>)}
            </select>
          </div>

          {/* Operatsiyalar */}
          <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
            {paginated.length === 0 ? (
              <div className="p-12 text-center text-text-secondary text-sm">{t('fin_cf_empty')}</div>
            ) : (
              <TableView id="exp_cashflow" optional={[t('fin_cf_account'), t('exp_col_responsible')]}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_date')}</th>
                      <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_type')}</th>
                      <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_note')}</th>
                      <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('fin_cf_account')}</th>
                      <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('exp_col_responsible')}</th>
                      <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('col_amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((r, i) => (
                      <tr key={`${r.kind}-${r.ref}-${r.ts}-${i}`} className="border-b border-border/50 hover:bg-bg-tertiary/50">
                        <td className="px-3 sm:px-4 py-2.5 text-text-secondary whitespace-nowrap text-xs">{fmtTs(r.ts)}</td>
                        <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${r.dir === 'in' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
                            {r.dir === 'in' ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />} {kindLabel(r.kind)}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-2.5 text-text-primary max-w-[260px] truncate">{rowNote(r) || '—'}</td>
                        <td className="px-3 sm:px-4 py-2.5 text-text-secondary text-xs whitespace-nowrap">{pmLabel(r.method, t)}</td>
                        <td className="px-3 sm:px-4 py-2.5 text-text-secondary text-xs whitespace-nowrap">{r.who || '—'}</td>
                        <td className={`px-3 sm:px-4 py-2.5 text-right font-semibold whitespace-nowrap ${r.dir === 'in' ? 'text-accent-green' : 'text-accent-red'}`}>
                          {r.dir === 'in' ? '+' : '−'}{fmtUZS(r.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </TableView>
            )}
            <Pagination page={page} totalPages={totalPages} total={rows.length} setPage={setPage} />
          </div>
        </>
      )}
      {!data && loading && (
        <div className="p-12 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

export default CashflowTab
