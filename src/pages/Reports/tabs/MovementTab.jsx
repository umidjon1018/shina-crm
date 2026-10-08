import { productTitle } from '../../../utils/format'
import React, { useState, useEffect, useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { ArrowDownToLine, ArrowUpFromLine, Boxes, CalendarCheck, PackageX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useShopStore } from '../../../store/shopStore'
import DateMaskInput from '../../../components/DateMaskInput'
import { getMovementReport, getStockAsOf } from '../../../api/reportService'
import PeriodPicker, { presetRange, ymd } from '../../Expenses/components/PeriodPicker'
import { StatCard } from '../../Expenses/components/expHelpers'
import ReportTable from '../components/ReportTable'
import { C } from '../components/shared'
import { useCategoryLabels } from '../components/useCategoryLabels'

const money = (v) => Math.round(Number(v) || 0).toLocaleString('uz-UZ')

const MovementTab = () => {
  const { t } = useTranslation()
  const { selectedShopId } = useShopStore()
  const catLabel = useCategoryLabels()
  const [view, setView] = useState('movement')
  const [preset, setPreset] = useState('month')
  const [range, setRange] = useState(presetRange('month'))
  const [date, setDate] = useState(ymd(new Date()))
  const [mov, setMov] = useState(null)
  const [asOf, setAsOf] = useState(null)
  const [category, setCategory] = useState('all')
  const [error, setError] = useState('')

  useEffect(() => {
    if (view !== 'movement') return
    setError('')
    getMovementReport({ ...range, shop_id: selectedShopId }).then(setMov).catch(e => setError(e?.response?.data?.error || t('exp_err_generic')))
  }, [view, range.from, range.to, selectedShopId])
  useEffect(() => {
    if (view !== 'asof' || !date) return
    setError('')
    getStockAsOf({ date, shop_id: selectedShopId }).then(setAsOf).catch(e => setError(e?.response?.data?.error || t('exp_err_generic')))
  }, [view, date, selectedShopId])

  const name = (r) => productTitle(r.brand, r.name) + (r.size ? ` (${r.size})` : '')
  const src = view === 'movement' ? (mov?.rows || []) : (asOf?.rows || [])
  const categories = useMemo(() => [...new Set(src.map(r => r.category))], [src])
  const rows = src.filter(r => category === 'all' || r.category === category)
  const sum = (k) => rows.reduce((s, r) => s + (r[k] || 0), 0)
  const shopSelected = selectedShopId && selectedShopId !== 'all'

  const byCat = useMemo(() => {
    const m = {}
    rows.forEach(r => {
      const k = catLabel(r.category)
      m[k] = m[k] || { name: k, received: 0, sold: 0, qty: 0 }
      m[k].received += r.received || 0
      m[k].sold += r.sold || 0
      m[k].qty += r.qty || 0
    })
    return Object.values(m)
  }, [rows])

  const movCols = [
    { key: 'name', label: t('rpt_col_product'), value: name, className: 'text-text-primary font-medium' },
    { optional: true, key: 'category', label: t('col_category'), render: r => catLabel(r.category), excelValue: r => catLabel(r.category) },
    { key: 'opening', label: t('rpt_col_opening'), align: 'right', sum: true },
    { key: 'received', label: t('rpt_col_received'), align: 'right', sum: true, className: 'text-accent-green' },
    { key: 'sold', label: t('rpt_col_sold'), align: 'right', sum: true, className: 'text-accent-red' },
    { optional: true, key: 'writtenOff', label: t('rpt_col_written_off'), align: 'right', sum: true },
    { optional: true, key: 'toSupplier', label: t('rpt_col_to_supplier'), align: 'right', sum: true },
    { optional: true, key: 'toDealer', label: t('rpt_col_to_dealer'), align: 'right', sum: true },
    { key: 'closing', label: t('rpt_col_closing'), align: 'right', sum: true, className: 'text-text-primary font-bold' },
    { optional: true, key: 'customerReturns', label: t('rpt_col_customer_returns'), align: 'right', sum: true, className: 'text-text-secondary' },
    ...(shopSelected ? [
      { optional: true, key: 'transferIn', label: t('rpt_col_transfer_in'), align: 'right', sum: true, className: 'text-text-secondary' },
      { optional: true, key: 'transferOut', label: t('rpt_col_transfer_out'), align: 'right', sum: true, className: 'text-text-secondary' },
    ] : []),
  ]
  const asOfCols = [
    { key: 'name', label: t('rpt_col_product'), value: name, className: 'text-text-primary font-medium' },
    { key: 'category', label: t('col_category'), render: r => catLabel(r.category), excelValue: r => catLabel(r.category) },
    { key: 'qty', label: t('rpt_col_qty'), align: 'right', sum: true },
    { key: 'retail', label: t('rpt_col_stock_retail'), align: 'right', sum: true, render: r => money(r.retail), renderTotal: money },
    ...(asOf?.showProfit ? [{ key: 'cost', label: t('rpt_col_stock_cost'), align: 'right', sum: true, render: r => money(r.cost), renderTotal: money }] : []),
  ]

  const loading = view === 'movement' ? !mov : !asOf

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {view === 'movement'
          ? <PeriodPicker preset={preset} range={range} onChange={(p, r) => { setPreset(p); setRange(r) }} />
          : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">{t('rpt_asof_date')}</span>
              <DateMaskInput value={date} onChange={e => e.target.value && setDate(e.target.value)}
                className="w-36 bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
            </div>
          )}
        <div className="flex gap-1 bg-bg-secondary border border-border rounded-xl p-1">
          {['movement', 'asof'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${view === v ? 'bg-accent-red text-white' : 'text-text-secondary'}`}>{t('rpt_mov_view_' + v)}</button>
          ))}
        </div>
      </div>
      {error && <div className="text-sm text-accent-red bg-accent-red/10 px-4 py-3 rounded-xl">{error}</div>}
      {loading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" /></div> : (
        <>
          {view === 'movement' ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <StatCard icon={Boxes} label={t('rpt_col_opening')} value={sum('opening')} color="bg-gray-500/10 text-gray-500" />
              <StatCard icon={ArrowDownToLine} label={t('rpt_col_received')} value={`+${sum('received')}`} color="bg-green-500/10 text-green-500" />
              <StatCard icon={ArrowUpFromLine} label={t('rpt_col_sold')} value={`−${sum('sold')}`} color="bg-accent-red/10 text-accent-red" />
              <StatCard icon={PackageX} label={t('rpt_col_out_other')} value={`−${sum('writtenOff') + sum('toSupplier') + sum('toDealer')}`} color="bg-orange-500/10 text-orange-500" />
              <StatCard icon={CalendarCheck} label={t('rpt_col_closing')} value={sum('closing')} color="bg-blue-500/10 text-blue-500" />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <StatCard icon={Boxes} label={t('rpt_col_qty')} value={sum('qty')} color="bg-blue-500/10 text-blue-500" />
              <StatCard icon={CalendarCheck} label={t('rpt_col_stock_retail')} value={money(sum('retail'))} color="bg-green-500/10 text-green-500" />
              {asOf?.showProfit && <StatCard icon={CalendarCheck} label={t('rpt_col_stock_cost')} value={money(sum('cost'))} color="bg-purple-500/10 text-purple-500" />}
            </div>
          )}

          {byCat.length > 0 && (
            <div className="bg-bg-secondary border border-border rounded-2xl p-4">
              <p className="font-syne font-bold text-text-primary text-sm mb-3">{t('rpt_by_category')}</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCat}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    {view === 'movement' ? (
                      <>
                        <Bar dataKey="received" name={t('rpt_col_received')} fill={C.green} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="sold" name={t('rpt_col_sold')} fill={C.red} radius={[4, 4, 0, 0]} />
                      </>
                    ) : <Bar dataKey="qty" name={t('rpt_col_qty')} fill={C.blue} radius={[4, 4, 0, 0]} />}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <ReportTable
            title={view === 'movement' ? t('rpt_mov_title') : t('rpt_asof_title', { date: date.split('-').reverse().join('.') })}
            fileName={view === 'movement' ? `tovar-harakati_${range.from}_${range.to}` : `qoldiq_${date}`}
            columns={view === 'movement' ? movCols : asOfCols}
            rows={rows}
            searchKeys={['name', 'brand', 'size']}
            initialSort={{ key: view === 'movement' ? 'sold' : 'qty', dir: 'desc' }}
            extraFilters={(
              <select value={category} onChange={e => setCategory(e.target.value)} className="bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary">
                <option value="all">{t('rpt_all_categories')}</option>
                {categories.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
              </select>
            )}
            footerNote={view === 'movement' ? t('rpt_mov_note') : t('rpt_asof_note')}
          />
        </>
      )}
    </div>
  )
}

export default MovementTab
