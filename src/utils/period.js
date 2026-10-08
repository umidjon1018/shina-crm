// Davr filtrlari uchun umumiy yordamchilar.
// Oy filtri qiymati: 'all' | 'YYYY-MM' | 'r:YYYY-MM-DD:YYYY-MM-DD' (foydalanuvchi tanlagan oraliq)

const pad = (n) => String(n).padStart(2, '0')
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// "Barchasi" — shu sanadan bugungacha
export const ALL_FROM = '2000-01-01'

export const presetRange = (id) => {
  const now = new Date()
  const y = now.getFullYear(), m = now.getMonth()
  switch (id) {
    case 'today': return { from: ymd(now), to: ymd(now) }
    case 'week': {
      const d = new Date(now); d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      return { from: ymd(d), to: ymd(now) }
    }
    case 'last_month': return { from: ymd(new Date(y, m - 1, 1)), to: ymd(new Date(y, m, 0)) }
    case 'quarter': return { from: ymd(new Date(y, Math.floor(m / 3) * 3, 1)), to: ymd(now) }
    case 'year': return { from: `${y}-01-01`, to: ymd(now) }
    case 'all': return { from: ALL_FROM, to: ymd(now) }
    case 'month':
    default: return { from: ymd(new Date(y, m, 1)), to: ymd(now) }
  }
}

export const isRange = (v) => typeof v === 'string' && v.startsWith('r:')
export const makeRange = (from, to) => `r:${from}:${to}`
export const parseRange = (v) => { const [, from, to] = String(v).split(':'); return { from, to } }

// Sana qiymatidan mahalliy 'YYYY-MM-DD'
const localYmd = (date) => {
  const s = String(date)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? s.slice(0, 10) : ymd(d)
}

// Sana tanlangan davrga tushadimi ('all' | oy | oraliq)
export const matchPeriod = (date, value) => {
  if (!value || value === 'all') return true
  if (!date) return false
  if (isRange(value)) {
    const { from, to } = parseRange(value)
    const d = localYmd(date)
    return d >= from && d <= to
  }
  return localYmd(date).slice(0, 7) === value
}

// Oy ('YYYY-MM') tanlangan davr bilan kesishadimi — oylik jadvallar uchun
export const monthInPeriod = (ym, value) => {
  if (!value || value === 'all') return true
  if (isRange(value)) {
    const { from, to } = parseRange(value)
    return ym >= from.slice(0, 7) && ym <= to.slice(0, 7)
  }
  return ym === value
}

// Davrning "asosiy oyi" (kunlik grafik, oylik reja uchun): oy — o'zi, oraliq — oxirgi oyi, barchasi — joriy oy
export const periodMonth = (value) => {
  if (isRange(value)) return parseRange(value).to.slice(0, 7)
  if (value && value !== 'all') return value
  return ymd(new Date()).slice(0, 7)
}

export const fmtYmd = (s) => (s ? `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}` : '')
export const rangeText = (from, to) => (from === to ? fmtYmd(from) : `${fmtYmd(from)} — ${fmtYmd(to)}`)
