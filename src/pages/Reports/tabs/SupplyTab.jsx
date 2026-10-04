import React, { useState, useEffect, useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { ClipboardList, DollarSign, PackagePlus, Truck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useShopStore } from '../../../store/shopStore'
import { getReceiptsReport, getSuppliersReport } from '../../../api/reportService'
import PeriodPicker, { presetRange } from '../../Expenses/components/PeriodPicker'
import { StatCard } from '../../Expenses/components/expHelpers'
import ReportTable from '../components/ReportTable'
import { C } from '../components/shared'

const money = (v) => Math.round(Number(v) || 0).toLocaleString('uz-UZ')
const usd = (v) => '$' + (Math.round((Number(v) || 0) * 100) / 100).toLocaleString('en-US')
const STATUS_CLS = { paid: 'bg-accent-green/10 text-accent-green', partial: 'bg-accent-orange/10 text-accent-orange', unpaid: 'bg-accent-red/10 text-accent-red' }

const SupplyTab = () => {
  const { t } = useTranslation()
  const { selectedShopId } = useShopStore()
  const [view, setView] = useState('receipts')
  const [preset, setPreset] = useState('month')
  const [range, setRange] = useState(presetRange('month'))
  const [rec, setRec] = useState(null)
  const [sup, setSup] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    const p = { ...range, shop_id: selectedShopId }
    Promise.all([getReceiptsReport(p), getSuppliersReport(p)])
      .then(([a, b]) => { setRec(a); setSup(b) })
      .catch(e => setError(e?.response?.data?.error || t('exp_err_generic')))
  }, [range.from, range.to, selectedShopId])

  const sp = rec?.showProfit
  const recRows = rec?.rows || []
  const supRows = (sup?.rows || []).filter(r => r.receipts || r.debtUsd || r.paidUsd || r.orders || r.openOrders)
  const bySupplier = useMemo(() => {
    const m = {}
    recRows.forEach(r => {
      m[r.supplier] = m[r.supplier] || { name: r.supplier, qty: 0, amount: 0 }
      m[r.supplier].qty += r.qty
      m[r.supplier].amount += r.totalUsd || 0
    })
    return Object.values(m).sort((a, b) => (sp ? b.amount - a.amount : b.qty - a.qty)).slice(0, 10)
  }, [recRows, sp])

  const recCols = [
    { key: 'date', label: t('col_date'), className: 'text-text-secondary' },
    { key: 'product', label: t('rpt_col_product'), className: 'text-text-primary font-medium' },
    { key: 'supplier', label: t('rpt_col_supplier') },
    { key: 'shop', label: t('rpt_col_shop'), className: 'text-text-secondary' },
    { key: 'qty', label: t('rpt_col_qty'), align: 'right', sum: true, render: r => `${r.qty} ${r.unit}` , excelValue: r => r.qty },
    ...(sp ? [
      { key: 'unitUsd', label: t('rpt_col_unit_usd'), align: 'right', render: r => usd(r.unitUsd) },
      { key: 'totalUsd', label: t('rpt_col_total_usd'), align: 'right', sum: true, render: r => usd(r.totalUsd), renderTotal: usd },
      { key: 'totalUzs', label: t('rpt_col_total_uzs'), align: 'right', sum: true, render: r => money(r.totalUzs), renderTotal: money },
      { key: 'paidUsd', label: t('rpt_col_paid_usd'), align: 'right', sum: true, render: r => usd(r.paidUsd), renderTotal: usd },
      { key: 'debtUsd', label: t('rpt_col_debt_usd'), align: 'right', sum: true, render: r => <span className={r.debtUsd > 0 ? 'text-accent-red' : ''}>{usd(r.debtUsd)}</span>, renderTotal: usd },
      { key: 'paymentStatus', label: t('col_status'), render: r => r.paymentStatus ? <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${STATUS_CLS[r.paymentStatus] || ''}`}>{t('rpt_pay_' + r.paymentStatus, r.paymentStatus)}</span> : '—' },
    ] : []),
    { key: 'receivedBy', label: t('rpt_col_received_by'), className: 'text-text-secondary' },
  ]
  const supCols = [
    { key: 'name', label: t('rpt_col_supplier'), className: 'text-text-primary font-medium' },
    { key: 'phone', label: t('col_phone'), className: 'text-text-secondary' },
    { key: 'receipts', label: t('rpt_col_receipts'), align: 'right', sum: true },
    { key: 'qty', label: t('rpt_col_qty'), align: 'right', sum: true },
    ...(sp ? [
      { key: 'amountUsd', label: t('rpt_col_total_usd'), align: 'right', sum: true, render: r => usd(r.amountUsd), renderTotal: usd },
      { key: 'paidUsd', label: t('rpt_col_paid_usd'), align: 'right', sum: true, render: r => usd(r.paidUsd), renderTotal: usd },
      { key: 'returnedUsd', label: t('rpt_col_returned_usd'), align: 'right', sum: true, render: r => usd(r.returnedUsd), renderTotal: usd },
      { key: 'debtUsd', label: t('rpt_col_debt_now'), align: 'right', sum: true, render: r => <span className={r.debtUsd > 0 ? 'text-accent-red font-semibold' : ''}>{usd(r.debtUsd)}</span>, renderTotal: usd },
    ] : []),
    { key: 'orders', label: t('rpt_col_orders'), align: 'right', sum: true },
    { key: 'openOrders', label: t('rpt_col_open_orders'), align: 'right', sum: true },
    { key: 'lastReceipt', label: t('rpt_col_last_receipt'), className: 'text-text-secondary', render: r => r.lastReceipt ? r.lastReceipt.split('-').reverse().join('.') : '—' },
  ]

  const totQty = recRows.reduce((s, r) => s + r.qty, 0)
  const totUsd = recRows.reduce((s, r) => s + (r.totalUsd || 0), 0)
  const totDebt = (sup?.rows || []).reduce((s, r) => s + (r.debtUsd || 0), 0)
  const openOrders = (sup?.rows || []).reduce((s, r) => s + (r.openOrders || 0), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <PeriodPicker preset={preset} range={range} onChange={(p, r) => { setPreset(p); setRange(r) }} />
        <div className="flex gap-1 bg-bg-secondary border border-border rounded-xl p-1">
          {['receipts', 'suppliers'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${view === v ? 'bg-accent-red text-white' : 'text-text-secondary'}`}>{t('rpt_supply_view_' + v)}</button>
          ))}
        </div>
      </div>
      {error && <div className="text-sm text-accent-red bg-accent-red/10 px-4 py-3 rounded-xl">{error}</div>}
      {!rec || !sup ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" /></div> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={PackagePlus} label={t('rpt_col_receipts')} value={recRows.length} sub={t('rpt_units', { n: totQty })} color="bg-green-500/10 text-green-500" />
            {sp && <StatCard icon={DollarSign} label={t('rpt_col_total_usd')} value={usd(totUsd)} color="bg-blue-500/10 text-blue-500" />}
            {sp && <StatCard icon={Truck} label={t('rpt_col_debt_now')} value={usd(totDebt)} color="bg-accent-red/10 text-accent-red" />}
            <StatCard icon={ClipboardList} label={t('rpt_col_open_orders')} value={openOrders}
              sub={(sup.orderStatuses || []).map(o => `${t('rpt_order_' + o.status, o.status)}: ${o.count}`).join(' · ')} color="bg-purple-500/10 text-purple-500" />
          </div>
          {bySupplier.length > 0 && (
            <div className="bg-bg-secondary border border-border rounded-2xl p-4">
              <p className="font-syne font-bold text-text-primary text-sm mb-3">{t('rpt_by_supplier')}</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bySupplier}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => (sp ? usd(v) : v)} />
                    <Bar dataKey={sp ? 'amount' : 'qty'} name={sp ? t('rpt_col_total_usd') : t('rpt_col_qty')} fill={C.blue} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {view === 'receipts'
            ? <ReportTable title={t('rpt_receipts_title')} fileName={`kirimlar_${range.from}_${range.to}`} columns={recCols} rows={recRows} searchKeys={['product', 'supplier', 'receivedBy']} />
            : <ReportTable title={t('rpt_suppliers_title')} fileName={`yetkazib-beruvchilar_${range.from}_${range.to}`} columns={supCols} rows={supRows} searchKeys={['name', 'phone']} initialSort={{ key: sp ? 'amountUsd' : 'qty', dir: 'desc' }} />}
        </>
      )}
    </div>
  )
}

export default SupplyTab
