import React, { useState, useMemo, useEffect } from 'react'
import { localToday, localMonth } from '../../../utils/tz'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, ChevronDown, CircleX, Eye } from 'lucide-react'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import CustomerMessenger from '../../../components/customers/CustomerMessenger'
import UiModal from '../../../components/ui/Modal'

// === SHARED KOMPONENTLAR ===
const InstagramDM = ({ instagram, phone, name, isBirthdayMonth, birthDate }) => (
  <div>
    {birthDate && (
      <div className="mb-4 bg-bg-tertiary rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-text-muted text-xs mb-0.5">Tug'ilgan kun</p>
          <p className="font-medium text-text-primary text-sm">{birthDate}</p>
        </div>
        {isBirthdayMonth && <span className="text-xl">🎂 Bu oy!</span>}
      </div>
    )}
    <div className="mb-5"><CustomerMessenger instagram={instagram} phone={phone} name={name} /></div>
  </div>
)

// Hisobotlar ichidagi oynalar — umumiy Modal (ichma-ich, Esc/orqaga faqat ustidagini yopadi, xl — keng)
const MODAL_SIZE = { sm: 'md', md: 'md', lg: 'lg', xl: 'xl', '2xl': 'xl', '3xl': 'xl' }
const Modal = ({ open, onClose, title, subtitle, children, size = 'lg' }) => (
  <UiModal open={!!open} onClose={onClose} title={title} subtitle={subtitle} size={MODAL_SIZE[size] || 'lg'} bodyClass="p-4 sm:p-6 overflow-x-auto">
    {children}
  </UiModal>
)

const MonthYearFilter = ({ value, onChange, includeAll = true }) => {
  const { t } = useTranslation()
  const getMonthsList = () => {
    const monthsSet = new Set()
    const currentMonth = localMonth()
    monthsSet.add(currentMonth)

    for (let i = 0; i < 24; i++) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      monthsSet.add(d.toISOString().slice(0, 7))
    }

    const monthNamesArr = t('exp_month_names', { returnObjects: true })

    return Array.from(monthsSet)
      .sort()
      .reverse()
      .map(m => {
        const [y, mo] = m.split('-')
        return { value: m, label: `${monthNamesArr[parseInt(mo) - 1] || mo} ${y}` }
      })
  }

  const months = getMonthsList()
  const options = includeAll ? [{ value:'all', label: t('filter_all') }, ...months] : months

  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none bg-bg-tertiary border border-border rounded-xl pl-3 pr-8 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-red transition-all cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
    </div>
  )
}

const GrowthBadge = ({ current, previous, suffix = '' }) => {
  if (!previous || previous === 0) return <span className="text-text-muted text-xs">—</span>
  const pct = Math.round(((current - previous) / previous) * 100)
  const isUp = pct >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${isUp ? 'text-accent-green' : 'text-accent-red'}`}>
      {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(pct)}%{suffix}
    </span>
  )
}

const DetailButton = ({ onClick }) => {
  const { t } = useTranslation()
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      className="text-xs font-bold text-text-muted hover:text-accent-red transition-colors flex items-center gap-1 border border-border hover:border-accent-red/40 rounded-lg px-2.5 py-1"
    >
      <Eye size={12} />
      {t('rep_detail')}
    </button>
  )
}

const Pagination = ({ total, pageSize, page, onPageChange }) => {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-border">
      <span className="text-xs text-text-muted">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total} ta
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:bg-bg-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
        >
          ‹
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce((acc, p, i, arr) => {
            if (i > 0 && arr[i - 1] !== p - 1) acc.push('...')
            acc.push(p)
            return acc
          }, [])
          .map((p, i) =>
            p === '...'
              ? <span key={`ellipsis-${i}`} className="w-7 text-center text-text-muted text-xs">…</span>
              : <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    p === page
                      ? 'bg-accent-red text-white'
                      : 'text-text-secondary hover:bg-bg-tertiary'
                  }`}
                >
                  {p}
                </button>
          )
        }
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:bg-bg-tertiary disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
        >
          ›
        </button>
      </div>
    </div>
  )
}

const ModalTable = ({ columns, data, pageSize = 10, emptyText, initialSortKey = 'soldAt', initialSortDir = 'desc', rowStyle }) => {
  const { t } = useTranslation()
  const [page, setPage]         = React.useState(1)
  const [sortKey, setSortKey]   = React.useState(initialSortKey)
  const [sortDir, setSortDir]   = React.useState(initialSortDir)

  // Data o'zgarganda 1-sahifaga qayt
  React.useEffect(() => { setPage(1) }, [data.length])

  // Sortlash
  const sortedData = React.useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }
      const as = String(av).toLowerCase()
      const bs = String(bv).toLowerCase()
      return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as)
    })
  }, [data, sortKey, sortDir])

  const paged = sortedData.slice((page - 1) * pageSize, page * pageSize)

  const handleSort = (key) => {
    if (!key) return
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  if (data.length === 0) {
    return <div className="py-10 text-center text-text-muted text-sm">{emptyText ?? t('rep_no_data')}</div>
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ tableLayout: columns.some(c => c.width) ? 'fixed' : 'auto' }}>
          <colgroup>
            {columns.map(col => (
              <col key={col.key} style={col.width ? { width: col.width } : {}} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-bg-tertiary border-b border-border">
              {columns.map(col => {
                const isSorted = sortKey === col.key
                const sortable = col.sortable !== false // default sortable=true
                return (
                  <th
                    key={col.key}
                    onClick={() => sortable && handleSort(col.key)}
                    className={`px-4 py-3 font-medium text-text-secondary whitespace-nowrap text-${col.align || 'left'} ${sortable ? 'cursor-pointer select-none hover:text-text-primary transition-colors' : ''} ${col.thClass || ''}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortable && (
                        <span className="inline-flex flex-col leading-none" style={{ fontSize: 8 }}>
                          <span style={{ color: isSorted && sortDir === 'asc' ? 'var(--accent-red)' : 'var(--text-muted)', lineHeight: 1 }}>▲</span>
                          <span style={{ color: isSorted && sortDir === 'desc' ? 'var(--accent-red)' : 'var(--text-muted)', lineHeight: 1 }}>▼</span>
                        </span>
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {paged.map((row, idx) => (
              <tr key={row.id || idx} className="hover:bg-bg-tertiary transition-colors" style={rowStyle ? rowStyle(row) : {}}>
                {columns.map(col => (
                  <td key={col.key} className={`px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-${col.align || 'left'} ${col.tdClass || ''}`}>
                    {col.render ? col.render(row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination total={data.length} pageSize={pageSize} page={page} onPageChange={setPage} />
    </div>
  )
}

const MonthlyDynamicsChart = ({ data, dataKey, color, formatter, name }) => {
  if (!data || data.length === 0) return null
  return (
    <div className="h-[180px] w-full" style={{ position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="name" fontSize={10} stroke="var(--text-muted)" />
          <YAxis hide />
          <Tooltip
            cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
            contentStyle={{ backgroundColor:'var(--bg-secondary)', borderColor:'var(--border)', borderRadius:'12px', color:'var(--text-primary)' }}
            itemStyle={{ color:'var(--text-primary)', fontSize:'12px' }}
            formatter={formatter}
            offset={10}
            isAnimationActive={false}
            wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }} />
          <Line
            type="monotone"
            dataKey={dataKey}
            name={name || dataKey}
            stroke={color}
            strokeWidth={2.5}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// MOCK — replace with: GET /api/sales
// MOCK — replace with: GET /api/sales
// MOCK — replace with: GET /api/customers
// MOCK — replace with: GET /api/expenses
// MOCK — replace with: GET /api/income-batches
// MOCK — replace with: GET /api/capital
// MOCK — replace with: GET /api/settings/monthly-targets
// MOCK — replace with: GET /api/employees


const C = {
  red:    '#E63946',
  green:  '#22C55E',
  blue:   '#3B82F6',
  orange: '#F59E0B',
  purple: '#8B5CF6',
  pink:   '#EC4899',
  muted:  '#6B7280',
  teal:   '#14B8A6',
}

const SOURCE_LABELS = {
  instagram: 'Instagram',
  telegram:  'Telegram',
  repeat:    'Qaytuvchi mijoz',
  walk_in:   "Ko'cha / Tasodif",
  referral:  "Do'stdan eshitgan",
}

const CANCEL_REASONS = {
  narx_mos_emas:          "Narx mos kelmadi",
  tovar_yoq:              "Tovar yo'q edi",
  mijoz_fikr_ozgartirdi:  "Mijoz fikrini o'zgartirdi",
  boshqa:                 "Boshqa sabab",
}

const getCancelReasonLabel = (reason) => {
  const r = reason || '';
  if (r === 'qaytarish' || r === 'bekor' || r === 'refund' || r === 'cancel') {
    return 'Bekor qilish';
  }
  if (r === 'almashtirish' || r === 'exchange') {
    return 'Almashtirish';
  }
  return CANCEL_REASONS[r] || r || '—';
}

const fmtUZS = (n) => new Intl.NumberFormat('uz-UZ').format(Math.round(n)) + ' UZS'
const fmtUSD = (n) => '$' + new Intl.NumberFormat('en-US').format(Math.round(n))
const fmtNum = (n) => new Intl.NumberFormat('uz-UZ').format(n)
const TODAY = localToday()

// UTC → O'zbekiston vaqti (+5) formatlovchi helper
const fmtSoldAt = (soldAt) => {
  if (!soldAt) return '—'
  const d = new Date(soldAt)
  d.setMinutes(d.getMinutes() + 300) // +5 soat
  return d.toISOString().replace('T', ' ').slice(0, 16)
}
// items[] — string yoki object bo'lishi mumkin
const fmtItems = (items) => {
  if (!Array.isArray(items)) return '—'
  // Bir xil nomlarni birlashtirish
  const nameMap = {}
  items.forEach(item => {
    const name = typeof item === 'string' ? item.split(' x')[0] : (item.name || '—')
    const qty  = typeof item === 'string' ? parseInt(item.split(' x')[1] || '1') : (item.qty || 1)
    nameMap[name] = (nameMap[name] || 0) + qty
  })
  return Object.entries(nameMap)
    .map(([name, qty]) => qty > 1 ? `${name} x${qty}` : name)
    .join(', ')
}

// ============================
// EXPORT HELPERS
// ============================
const exportCSV = (filename, rows) => {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => {
      const v = r[h] ?? ''
      return `"${String(v).replace(/"/g, '""')}"`
    }).join(','))
  ].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename + '.csv'; a.click()
  URL.revokeObjectURL(url)
}

const exportXLSX = async (filename, sheets) => {
  const XLSX = await import('xlsx')
  // sheets: [{ name, rows }]
  const wb = XLSX.utils.book_new()
  sheets.forEach(({ name, rows }) => {
    if (!rows.length) return
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31))
  })
  XLSX.writeFile(wb, filename + '.xlsx')
}

const exportPDF = (filename, title, columns, rows) => {
  // jspdf + jspdf-autotable CDN orqali yuklash
  const script1 = document.createElement('script')
  script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
  script1.onload = () => {
    const script2 = document.createElement('script')
    script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
    script2.onload = () => {
      const { jsPDF } = window.jspdf
      const doc = new jsPDF({ orientation: 'landscape' })
      doc.setFont('helvetica')
      doc.setFontSize(14)
      doc.text(title, 14, 16)
      doc.setFontSize(9)
      doc.text(`Sana: ${new Date().toLocaleDateString('uz-UZ')}`, 14, 22)
      doc.autoTable({
        head: [columns],
        body: rows,
        startY: 28,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [230, 57, 70], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      })
      doc.save(filename + '.pdf')
    }
    document.head.appendChild(script2)
  }
  // Agar allaqachon yuklangan bo'lsa
  if (window.jspdf?.jsPDF) {
    script1.onload()
  } else {
    document.head.appendChild(script1)
  }
}

export {
  InstagramDM,
  Modal,
  MonthYearFilter,
  GrowthBadge,
  DetailButton,
  Pagination,
  ModalTable,
  MonthlyDynamicsChart,
  C,
  SOURCE_LABELS,
  CANCEL_REASONS,
  getCancelReasonLabel,
  fmtUZS,
  fmtUSD,
  fmtNum,
  TODAY,
  fmtSoldAt,
  fmtItems,
  exportCSV,
  exportXLSX,
  exportPDF,
}


