import React, { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, ChevronDown, CircleX, Eye } from 'lucide-react'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import * as XLSX from 'xlsx'

// === SHARED KOMPONENTLAR ===
const InstagramDM = ({ instagram, phone, name, isBirthdayMonth, birthDate }) => {
  const igHandle = instagram ? instagram.replace(/^@/, '') : ''
  const rawPhone = phone ? phone.replace(/\D/g, '') : ''
  const tgPhone  = rawPhone.startsWith('998') ? rawPhone : rawPhone ? '998' + rawPhone : ''
  const tgLink   = tgPhone ? `https://t.me/+${tgPhone}` : null

  const defaultTexts = [
    `Hurmatli ${name.split(' ')[0]}, tug'ilgan kuningiz bilan! 🎉 Do'konimizdan maxsus sovg'a kutmoqda.`,
    `Salom ${name.split(' ')[0]}! Siz uchun maxsus chegirma: -10%. Bugun bizga tashrif buyuring! 🚗`,
    `${name.split(' ')[0]}, mavsumiy shina almashish vaqti keldi! Hozir keling — tez xizmat kafolat. ✅`,
  ]
  const tplLabels = ['Tabrik', 'Aksiya', 'Mavsum']
  const [dmMsg,      setDmMsg]      = React.useState('')
  const [tplTexts,   setTplTexts]   = React.useState(defaultTexts)
  const [editingTpl, setEditingTpl] = React.useState(-1)

  return (
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
      <div className="mb-5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
        {igHandle && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-[10px]">IG</span>
            </div>
            <p className="text-text-primary text-sm font-medium">@{igHandle}</p>
          </div>
        )}
        <div className="flex gap-2 mb-2 flex-wrap">
          {tplLabels.map((label, i) => (
            <div key={label} className="flex items-center">
              <button onClick={() => { setDmMsg(tplTexts[i]); setEditingTpl(-1) }}
                className="px-2.5 py-1 rounded-l-lg text-[10px] font-bold border border-r-0 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors">
                {label}
              </button>
              <button onClick={() => setEditingTpl(editingTpl === i ? -1 : i)}
                title="Shablon matnini tahrirlash"
                className={`px-1.5 py-1 rounded-r-lg text-[10px] border border-purple-500/30 transition-colors ${editingTpl === i ? 'bg-purple-500/20 text-purple-300' : 'text-purple-400 hover:bg-purple-500/10'}`}>
                ✏️
              </button>
            </div>
          ))}
        </div>
        {editingTpl >= 0 && (
          <textarea
            value={tplTexts[editingTpl]}
            onChange={e => { const t = [...tplTexts]; t[editingTpl] = e.target.value; setTplTexts(t) }}
            rows={2}
            className="w-full bg-bg-secondary border border-purple-500/40 rounded-xl px-3 py-2 text-xs text-text-primary resize-none focus:outline-none focus:border-purple-500/70 mb-2"
            placeholder="Shablon matnini tahrirlang..."
          />
        )}
        <textarea
          value={dmMsg}
          onChange={e => setDmMsg(e.target.value)}
          placeholder="Xabar matni..."
          rows={3}
          className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary resize-none focus:outline-none focus:border-purple-500/50 mb-2"
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-text-muted text-xs flex-1">
            {igHandle && tgLink ? 'Instagram yoki Telegram orqali yuborish' : igHandle ? 'Instagram direct' : 'Telegram orqali'}
          </p>
          <div className="flex items-center gap-2">
            {/* Kelajak: Telegram bot tokeni settingsStore da saqlangan holda avtomatik yuborish */}
            {tgLink && (
              <a href={`${tgLink}`}
                target="_blank" rel="noopener noreferrer"
                title={`Telegram: +${tgPhone}`}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 transition-colors">
                TM yuborish
              </a>
            )}
            {/* Kelajak: Instagram Graph API yoki uchinchi tomon xizmat (manychat.com va sh.k.) orqali avtomatlashtirish */}
            {igHandle && (
              <a href={`https://ig.me/m/${igHandle}?text=${encodeURIComponent(dmMsg)}`}
                target="_blank" rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity">
                DM yuborish
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const Modal = ({ open, onClose, title, subtitle, children, size = 'lg' }) => {
  React.useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const sizeClass = {
    sm: 'max-w-lg',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    '3xl': 'max-w-[90vw]',
  }[size] || 'max-w-4xl'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.18 }}
        className={`w-full ${sizeClass} bg-bg-secondary border border-border rounded-3xl shadow-2xl flex flex-col`}
        style={{ height: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <div>
            <h3 className="text-lg font-syne font-bold text-text-primary">{title}</h3>
            {subtitle && <p className="text-text-muted text-sm mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-border transition-all ml-4 flex-shrink-0"
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto overflow-x-auto flex-1 px-6 py-5 min-h-0">
          {children}
        </div>
      </motion.div>
    </div>
  )
}

const MonthYearFilter = ({ value, onChange, includeAll = true }) => {
  const { t } = useTranslation()
  const getMonthsList = () => {
    const monthsSet = new Set()
    const currentMonth = new Date().toISOString().slice(0, 7)
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
    <div className="flex items-center justify-between px-6 py-3 border-t border-border">
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

const ModalTable = ({ columns, data, pageSize = 10, emptyText, initialSortKey = 'soldAt', initialSortDir = 'desc' }) => {
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
              <tr key={row.id || idx} className="hover:bg-bg-tertiary transition-colors">
                {columns.map(col => (
                  <td key={col.key} className={`px-4 py-3 whitespace-nowrap text-${col.align || 'left'} ${col.tdClass || ''}`}>
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
const TODAY = new Date().toISOString().slice(0, 10)

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

const exportXLSX = (filename, sheets) => {
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


