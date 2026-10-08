import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Ixcham jadval: kompyuterda jadval, telefonda karta. Qator bosilsa — onRowClick (odatda to'liq ma'lumot modali).
// columns: [{ key, label, render(row), sortValue(row), align: 'left'|'right'|'center', className, hideOnMobile }]
const DataTable = ({
  columns, rows, rowKey = (r) => r.id, onRowClick, mobileCard, pageSize = 20,
  empty, initialSort = null, rowClass, resetKey,
}) => {
  const [sort, setSort] = useState(initialSort)
  const [page, setPage] = useState(1)
  useEffect(() => { setPage(1) }, [resetKey, rows.length])

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find(c => c.key === sort.key)
    if (!col) return rows
    const val = col.sortValue || ((r) => r[col.key])
    return [...rows].sort((a, b) => {
      const av = val(a), bv = val(b)
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av ?? '').localeCompare(String(bv ?? ''))
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [rows, sort, columns])

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const cur = Math.min(page, pages)
  const visible = sorted.slice((cur - 1) * pageSize, cur * pageSize)
  const toggle = (c) => {
    if (!c.sortValue && c.sortable === false) return
    setSort(s => (s?.key === c.key ? { key: c.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: c.key, dir: 'desc' }))
  }
  const align = (a) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left')

  if (!rows.length) {
    return <div className="bg-bg-secondary border border-border rounded-2xl py-14 text-center text-text-muted">{empty}</div>
  }

  return (
    <div className="space-y-3">
      {/* Telefon: kartalar */}
      {mobileCard && (
        <div className="sm:hidden space-y-2">
          {visible.map(r => (
            <div key={rowKey(r)} onClick={() => onRowClick?.(r)}
              className={`bg-bg-secondary border border-border rounded-2xl p-3.5 active:scale-[0.99] transition-transform ${onRowClick ? 'cursor-pointer' : ''} ${rowClass?.(r) || ''}`}>
              {mobileCard(r)}
            </div>
          ))}
        </div>
      )}
      {/* Kompyuter: jadval */}
      <div className={`${mobileCard ? 'hidden sm:block' : ''} bg-bg-secondary border border-border rounded-2xl overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead className="bg-bg-tertiary">
            <tr>
              {columns.map(c => (
                <th key={c.key} onClick={() => toggle(c)}
                  className={`px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wide whitespace-nowrap select-none ${align(c.align)} ${c.sortValue ? 'cursor-pointer hover:text-text-primary' : ''}`}>
                  {c.label}{sort?.key === c.key && <span className="ml-1 text-accent-blue">{sort.dir === 'asc' ? '▲' : '▼'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map(r => (
              <tr key={rowKey(r)} onClick={() => onRowClick?.(r)}
                className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-bg-tertiary/60' : ''} ${rowClass?.(r) || ''}`}>
                {columns.map(c => (
                  <td key={c.key} className={`px-4 py-3 text-[15px] text-text-primary ${align(c.align)} ${c.className || ''}`}>
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-text-muted px-1">
          <span>{Math.min(cur * pageSize, sorted.length)} / {sorted.length} ta</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={cur === 1} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center disabled:opacity-40 hover:bg-bg-tertiary"><ChevronLeft size={18} /></button>
            <span className="font-semibold text-text-primary">{cur} / {pages}</span>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={cur === pages} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center disabled:opacity-40 hover:bg-bg-tertiary"><ChevronRight size={18} /></button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
