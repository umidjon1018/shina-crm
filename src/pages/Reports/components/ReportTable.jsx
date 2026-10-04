import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, Download, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { exportXLSX } from './shared'

const PAGE = 25

// columns: [{ key, label, align, render(row), value(row) (saralash/Excel uchun), sum: true, excel: false }]
const ReportTable = ({ title, columns, rows, fileName, searchKeys = [], initialSort, extraFilters, emptyText, footerNote }) => {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState(initialSort || null)
  const [page, setPage] = useState(1)

  const val = (c, r) => (c.value ? c.value(r) : r[c.key])

  const filtered = useMemo(() => {
    let l = rows
    if (q.trim() && searchKeys.length) {
      const s = q.toLowerCase()
      l = l.filter(r => searchKeys.some(k => String(r[k] ?? '').toLowerCase().includes(s)))
    }
    if (sort) {
      const c = columns.find(x => x.key === sort.key)
      if (c) l = [...l].sort((a, b) => {
        const av = val(c, a), bv = val(c, b)
        const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av ?? '').localeCompare(String(bv ?? ''))
        return sort.dir === 'asc' ? cmp : -cmp
      })
    }
    return l
  }, [rows, q, sort, columns])

  const totals = useMemo(() => {
    const o = {}
    columns.filter(c => c.sum).forEach(c => { o[c.key] = filtered.reduce((s, r) => s + (Number(val(c, r)) || 0), 0) })
    return o
  }, [filtered, columns])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const shown = filtered.slice((page - 1) * PAGE, page * PAGE)

  const toggleSort = (c) => {
    if (c.sortable === false) return
    setSort(s => (s?.key === c.key ? { key: c.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: c.key, dir: 'desc' }))
  }

  const doExport = () => {
    const cols = columns.filter(c => c.excel !== false)
    const data = filtered.map(r => Object.fromEntries(cols.map(c => [c.label, c.excelValue ? c.excelValue(r) : val(c, r) ?? ''])))
    if (Object.keys(totals).length) data.push(Object.fromEntries(cols.map((c, i) => [c.label, c.sum ? totals[c.key] : (i === 0 ? t('rpt_total') : '')])))
    exportXLSX(fileName || 'hisobot', [{ name: (title || 'Hisobot').slice(0, 31), rows: data }])
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 flex-wrap px-4 py-3 border-b border-border">
        {title && <h3 className="font-syne font-bold text-text-primary mr-auto">{title} <span className="text-text-muted text-xs font-normal">({filtered.length})</span></h3>}
        {extraFilters}
        {searchKeys.length > 0 && (
          <div className="relative w-full sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input value={q} onChange={e => { setQ(e.target.value); setPage(1) }} placeholder={t('rpt_search')}
              className="w-full bg-bg-tertiary border border-border rounded-xl pl-8 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
          </div>
        )}
        <button onClick={doExport} disabled={!filtered.length}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-green/10 text-accent-green text-xs font-bold disabled:opacity-40">
          <Download size={14} /> Excel
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map(c => (
                <th key={c.key} onClick={() => toggleSort(c)}
                  className={`px-3 py-2.5 text-[11px] uppercase tracking-wide font-bold text-text-muted whitespace-nowrap select-none ${c.sortable === false ? '' : 'cursor-pointer hover:text-text-primary'} ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'}`}>
                  {c.label}
                  {sort?.key === c.key && (sort.dir === 'asc' ? <ChevronUp size={12} className="inline ml-0.5" /> : <ChevronDown size={12} className="inline ml-0.5" />)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan={columns.length} className="px-3 sm:px-4 py-10 text-center text-text-muted">{emptyText || t('rpt_empty')}</td></tr>}
            {shown.map((r, i) => (
              <tr key={r.id ?? i} className="border-b border-border/50 hover:bg-bg-tertiary/40">
                {columns.map(c => (
                  <td key={c.key} className={`px-3 py-2.5 whitespace-nowrap ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'} ${c.className || 'text-text-primary'}`}>
                    {c.render ? c.render(r) : (val(c, r) ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
            {shown.length > 0 && Object.keys(totals).length > 0 && (
              <tr className="bg-bg-tertiary/60 font-bold">
                {columns.map((c, i) => (
                  <td key={c.key} className={`px-3 py-2.5 whitespace-nowrap ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left'} text-text-primary`}>
                    {c.sum ? (c.renderTotal ? c.renderTotal(totals[c.key]) : Math.round(totals[c.key]).toLocaleString('uz-UZ')) : (i === 0 ? t('rpt_total') : '')}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {(pages > 1 || footerNote) && (
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border text-xs text-text-secondary flex-wrap">
          <span>{`${Math.min(page * PAGE, filtered.length)} / ${filtered.length} ta`}{footerNote ? ` · ${footerNote}` : ''}</span>
          {pages > 1 && (
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2.5 py-1 rounded-lg border border-border disabled:opacity-30">‹</button>
              <span className="px-2">{page} / {pages}</span>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="px-2.5 py-1 rounded-lg border border-border disabled:opacity-30">›</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ReportTable
