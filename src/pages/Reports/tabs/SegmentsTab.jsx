import React, { useState, useEffect, useMemo } from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { useTranslation } from 'react-i18next'
import { useShopStore } from '../../../store/shopStore'
import { getCustomersReport } from '../../../api/reportService'
import PeriodPicker, { presetRange } from '../../Expenses/components/PeriodPicker'
import ReportTable from '../components/ReportTable'
import { C } from '../components/shared'

const money = (v) => Math.round(Number(v) || 0).toLocaleString('uz-UZ')
const SEG_COLORS = {
  champions: C.green, loyal: C.blue, new: C.teal, promising: C.purple,
  at_risk: C.orange, sleeping: C.pink, lost: C.red, no_purchase: C.muted,
}

const SegmentsTab = () => {
  const { t } = useTranslation()
  const { selectedShopId } = useShopStore()
  const [preset, setPreset] = useState('month')
  const [range, setRange] = useState(presetRange('month'))
  const [data, setData] = useState(null)
  const [segment, setSegment] = useState('all')
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    getCustomersReport({ ...range, shop_id: selectedShopId }).then(setData).catch(e => setError(e?.response?.data?.error || t('exp_err_generic')))
  }, [range.from, range.to, selectedShopId])

  const rows = useMemo(() => (data?.rows || []).filter(r => segment === 'all' || r.segment === segment), [data, segment])
  const totalSpent = (data?.segments || []).reduce((s, x) => s + x.spent, 0)
  const pie = (data?.segments || []).filter(s => s.count > 0).map(s => ({ name: t('rpt_seg_' + s.segment), value: s.count, key: s.segment }))
  const dmy = (d) => (d ? d.split('-').reverse().join('.') : '—')

  const cols = [
    { key: 'name', label: t('col_customer'), className: 'text-text-primary font-medium' },
    { key: 'phone', label: t('col_phone'), className: 'text-text-secondary' },
    { key: 'segment', label: t('rpt_col_segment'), render: r => <span className="px-2 py-0.5 rounded-md text-[11px] font-bold" style={{ background: SEG_COLORS[r.segment] + '22', color: SEG_COLORS[r.segment] }}>{t('rpt_seg_' + r.segment)}</span>, excelValue: r => t('rpt_seg_' + r.segment) },
    { key: 'visits', label: t('rpt_col_visits'), align: 'right', sum: true },
    { key: 'spent', label: t('rpt_col_spent'), align: 'right', sum: true, render: r => money(r.spent), renderTotal: money },
    { key: 'avgCheck', label: t('rpt_col_avg_check'), align: 'right', render: r => money(r.avgCheck) },
    { key: 'items', label: t('rpt_col_items'), align: 'right', sum: true },
    { key: 'periodVisits', label: t('rpt_col_period_visits'), align: 'right', sum: true },
    { key: 'periodSpent', label: t('rpt_col_period_spent'), align: 'right', sum: true, render: r => money(r.periodSpent), renderTotal: money },
    { key: 'firstVisit', label: t('rpt_col_first_visit'), render: r => dmy(r.firstVisit), className: 'text-text-secondary' },
    { key: 'lastVisit', label: t('rpt_col_last_visit'), render: r => dmy(r.lastVisit), className: 'text-text-secondary' },
    { key: 'recency', label: t('rpt_col_recency'), align: 'right', value: r => (r.recency == null ? 99999 : r.recency), render: r => r.recency ?? '—' },
    ...(data?.loyaltyEnabled ? [{ key: 'loyaltyPercent', label: t('rpt_col_loyalty'), align: 'right', render: r => (r.loyaltyPercent ? `${r.loyaltyPercent}%` : '—') }] : []),
    { key: 'group', label: t('rpt_col_group'), className: 'text-text-secondary' },
  ]

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <PeriodPicker preset={preset} range={range} onChange={(p, r) => { setPreset(p); setRange(r) }} />
        <p className="text-xs text-text-muted max-w-md">{t('rpt_seg_hint')}</p>
      </div>
      {error && <div className="text-sm text-accent-red bg-accent-red/10 px-4 py-3 rounded-xl">{error}</div>}
      {!data ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" /></div> : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
              {data.segments.map(s => (
                <button key={s.segment} onClick={() => setSegment(segment === s.segment ? 'all' : s.segment)}
                  className={`text-left bg-bg-secondary border rounded-2xl p-3 transition-all ${segment === s.segment ? 'border-accent-red' : 'border-border hover:border-accent-red/40'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: SEG_COLORS[s.segment] }} />
                    <span className="text-xs font-bold text-text-primary">{t('rpt_seg_' + s.segment)}</span>
                  </div>
                  <p className="text-xl font-syne font-bold text-text-primary">{s.count}</p>
                  <p className="text-[11px] text-text-muted">{money(s.spent)} · {totalSpent ? Math.round(s.spent / totalSpent * 100) : 0}%</p>
                  <p className="text-[10px] text-text-muted mt-1 leading-tight">{t('rpt_seg_' + s.segment + '_desc')}</p>
                </button>
              ))}
            </div>
            <div className="bg-bg-secondary border border-border rounded-2xl p-4">
              <p className="font-syne font-bold text-text-primary text-sm mb-2">{t('rpt_seg_chart')}</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                      {pie.map(x => <Cell key={x.key} fill={SEG_COLORS[x.key]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          {data.loyaltyEnabled && (
            <div className="bg-bg-secondary border border-border rounded-2xl p-4">
              <p className="font-syne font-bold text-text-primary text-sm mb-3">{t('rpt_loyalty_tiers')}</p>
              <div className="flex flex-wrap gap-2">
                {data.loyaltyTiers.map(tr => (
                  <div key={tr.percent} className="px-3 py-2 rounded-xl bg-bg-tertiary text-xs">
                    <span className="font-bold text-text-primary">{tr.percent ? `${tr.percent}%` : t('cust_tier_none')}</span>
                    {tr.percent > 0 && <span className="text-text-muted"> · {money(tr.minAmount)}+</span>}
                    <span className="ml-2 text-accent-blue font-bold">{tr.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <ReportTable title={t('rpt_cust_title')} fileName={`mijozlar_${range.from}_${range.to}`} columns={cols} rows={rows}
            searchKeys={['name', 'phone', 'group']} initialSort={{ key: 'spent', dir: 'desc' }} />
        </>
      )}
    </div>
  )
}

export default SegmentsTab
