import React, { useState, useEffect } from 'react'
import { RefreshCw, TrendingDown, TrendingUp, Percent, Scale } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useShopStore } from '../../../store/shopStore'
import { useDataStore } from '../../../store/dataStore'
import { getPnl } from '../../../api/financeService'
import { useFinanceCategories } from '../components/useFinanceCategories'
import { fmtUZS, getCatLabel, StatCard, fmtDate } from '../components/expHelpers'
import PeriodPicker, { presetRange, previousRange } from '../components/PeriodPicker'

const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0)

const PnlTab = () => {
  const { t } = useTranslation()
  const { selectedShopId } = useShopStore()
  const { version } = useDataStore()
  const { categories } = useFinanceCategories()
  const [preset, setPreset] = useState('month')
  const [range, setRange] = useState(presetRange('month'))
  const [cur, setCur] = useState(null)
  const [prev, setPrev] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const prevRange = previousRange(range)

  const load = () => {
    setLoading(true); setError('')
    Promise.all([
      getPnl({ ...range, shopId: selectedShopId }),
      getPnl({ ...prevRange, shopId: selectedShopId }),
    ])
      .then(([a, b]) => { setCur(a); setPrev(b) })
      .catch(e => setError(e?.response?.data?.error || t('exp_err_generic')))
      .finally(() => setLoading(false))
  }
  useEffect(load, [range.from, range.to, selectedShopId, version])

  const catName = (id) => {
    if (id === '__writeoff') return t('fin_pnl_writeoff')
    const c = categories.find(x => x.id === id)
    return c ? getCatLabel(c, t) : t('fin_pnl_no_category')
  }

  // Kategoriya bo'yicha qatorlar (joriy + oldingi davr birlashtirilgan)
  const catRows = (key) => {
    const ids = new Set([...(cur?.[key] || []), ...(prev?.[key] || [])].map(x => x.categoryId || ''))
    const total = (list, id) => (list || []).filter(x => (x.categoryId || '') === id).reduce((s, x) => s + x.total, 0)
    return [...ids]
      .map(id => ({ id, label: catName(id || null), cur: total(cur?.[key], id), prev: total(prev?.[key], id) }))
      .sort((a, b) => b.cur - a.cur)
  }

  const Row = ({ label, a, b, sign = 1, level = 0, strong, highlight, hint }) => {
    const ch = b ? Math.round(((a - b) / Math.abs(b)) * 1000) / 10 : null
    const good = sign > 0 ? (a - b) >= 0 : (a - b) <= 0
    return (
      <tr className={`border-b border-border/50 ${highlight ? 'bg-bg-tertiary/60' : ''}`}>
        <td className={`px-4 py-2.5 ${strong ? 'font-bold text-text-primary' : 'text-text-secondary'}`} style={{ paddingLeft: 16 + level * 20 }}>
          {label}{hint && <span className="text-text-muted text-xs ml-1.5">{hint}</span>}
        </td>
        <td className={`px-4 py-2.5 text-right whitespace-nowrap ${strong ? 'font-bold' : ''} ${a < 0 ? 'text-accent-red' : 'text-text-primary'}`}>
          {sign < 0 && a > 0 ? '−' + fmtUZS(a) : fmtUZS(a)}
        </td>
        <td className="px-4 py-2.5 text-right whitespace-nowrap text-text-muted hidden sm:table-cell">
          {sign < 0 && b > 0 ? '−' + fmtUZS(b) : fmtUZS(b)}
        </td>
        <td className={`px-4 py-2.5 text-right whitespace-nowrap text-xs hidden sm:table-cell ${ch == null || a === b ? 'text-text-muted' : good ? 'text-accent-green' : 'text-accent-red'}`}>
          {ch == null ? '—' : `${ch > 0 ? '+' : ''}${ch}%`}
        </td>
      </tr>
    )
  }

  const c = cur, p = prev
  const revenueAll = c ? c.revenue + c.usedRevenue : 0
  const prevRevenueAll = p ? p.revenue + p.usedRevenue : 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <PeriodPicker preset={preset} range={range} onChange={(pr, r) => { setPreset(pr); setRange(r) }}
          presets={['month', 'last_month', 'quarter', 'year']} />
        <button onClick={load} className="p-2.5 rounded-xl border border-border bg-bg-secondary text-text-secondary hover:text-text-primary">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && <div className="text-sm text-accent-red bg-accent-red/10 px-4 py-3 rounded-xl">{error}</div>}

      {c && p && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={TrendingUp} label={t('fin_pnl_revenue_total')} value={fmtUZS(revenueAll)} sub={`${c.salesCount + c.usedCount} ${t('fin_pnl_sales_cnt')}`} color="bg-green-500/10 text-green-500" />
            <StatCard icon={Scale} label={t('fin_pnl_gross')} value={fmtUZS(c.grossProfit)} sub={`${t('fin_pnl_margin')} ${pct(c.grossProfit, revenueAll)}%`} color="bg-blue-500/10 text-blue-500" />
            <StatCard icon={TrendingDown} label={t('fin_pnl_opex')} value={fmtUZS(c.totalExpenses)} sub={`${t('exp_type_fixed')}: ${fmtUZS(c.fixedExpenses)}`} color="bg-accent-red/10 text-accent-red" />
            <StatCard icon={Percent} label={t('fin_pnl_net')} value={fmtUZS(c.netProfit)} sub={`${t('fin_pnl_margin')} ${pct(c.netProfit, revenueAll)}%`}
              color={c.netProfit >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-accent-red/10 text-accent-red'} />
          </div>

          <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-syne font-bold text-text-primary">{t('fin_pnl_title')}</h3>
              <p className="text-text-muted text-xs mt-0.5">{fmtDate(range.from)} — {fmtDate(range.to)}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs">
                    <th className="text-left px-4 py-2.5 text-text-secondary font-medium">{t('fin_pnl_item')}</th>
                    <th className="text-right px-4 py-2.5 text-text-secondary font-medium">{t('fin_pnl_current')}</th>
                    <th className="text-right px-4 py-2.5 text-text-secondary font-medium hidden sm:table-cell">
                      {t('fin_pnl_previous')}<div className="font-normal text-text-muted">{fmtDate(prevRange.from)} — {fmtDate(prevRange.to)}</div>
                    </th>
                    <th className="text-right px-4 py-2.5 text-text-secondary font-medium hidden sm:table-cell">{t('fin_pnl_change')}</th>
                  </tr>
                </thead>
                <tbody>
                  <Row label={t('fin_pnl_sales_revenue')} hint={`(${c.salesCount})`} a={c.revenue} b={p.revenue} />
                  <Row label={t('fin_pnl_cogs')} a={c.cogs} b={p.cogs} sign={-1} level={1} />
                  {(c.usedRevenue > 0 || p.usedRevenue > 0) && <>
                    <Row label={t('fin_pnl_used_revenue')} hint={`(${c.usedCount})`} a={c.usedRevenue} b={p.usedRevenue} />
                    <Row label={t('fin_pnl_used_cogs')} a={c.usedCogs} b={p.usedCogs} sign={-1} level={1} />
                  </>}
                  <Row label={t('fin_pnl_gross')} a={c.grossProfit} b={p.grossProfit} strong highlight />
                  {(c.commission > 0 || p.commission > 0) && <Row label={t('fin_pnl_commission')} a={c.commission} b={p.commission} sign={-1} level={1} />}
                  {(c.cashback > 0 || p.cashback > 0) && <Row label={t('fin_pnl_cashback')} a={c.cashback} b={p.cashback} sign={-1} level={1} />}
                  <Row label={t('fin_pnl_opex')} a={c.totalExpenses} b={p.totalExpenses} sign={-1} strong />
                  {catRows('expenses').map(r => <Row key={'e' + r.id} label={r.label} a={r.cur} b={r.prev} sign={-1} level={1} />)}
                  <Row label={t('fin_pnl_operating')} a={c.operatingProfit} b={p.operatingProfit} strong highlight />
                  <Row label={t('fin_pnl_other_income')} a={c.totalOtherIncome} b={p.totalOtherIncome} strong />
                  {catRows('incomes').map(r => <Row key={'i' + r.id} label={r.label} a={r.cur} b={r.prev} level={1} />)}
                  <tr className="bg-accent-red/5">
                    <td className="px-4 py-3 font-extrabold text-text-primary">{t('fin_pnl_net')}</td>
                    <td className={`px-4 py-3 text-right font-extrabold whitespace-nowrap ${c.netProfit >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{fmtUZS(c.netProfit)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap text-text-muted hidden sm:table-cell">{fmtUZS(p.netProfit)}</td>
                    <td className="px-4 py-3 text-right text-xs hidden sm:table-cell text-text-muted">
                      {p.netProfit ? `${c.netProfit - p.netProfit >= 0 ? '+' : ''}${Math.round(((c.netProfit - p.netProfit) / Math.abs(p.netProfit)) * 1000) / 10}%` : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="px-4 py-3 text-text-muted text-xs border-t border-border">{t('fin_pnl_note')}</p>
          </div>
        </>
      )}
      {!c && loading && (
        <div className="p-12 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

export default PnlTab
