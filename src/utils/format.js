import i18n from '../i18n'

// Umumiy formatlash — har sahifada alohida formatPrice yozilmasin
export const formatNumber = (n) => Math.round(Number(n) || 0).toLocaleString('uz-UZ')
export const formatPrice = (n) => `${formatNumber(n)} ${i18n.t('unit_som')}`
export const formatUSD = (n) => `$${(Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`

// 'YYYY-MM-DD...' → 'dd.mm.yyyy'
export const formatDate = (v) => {
  if (!v) return '—'
  const s = String(v)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, d] = s.slice(0, 10).split('-')
    return `${d}.${m}.${y}`
  }
  const dt = new Date(v)
  return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('ru-RU')
}

export const formatDateTime = (v) => {
  if (!v) return '—'
  const dt = new Date(v)
  if (Number.isNaN(dt.getTime())) return '—'
  return `${dt.toLocaleDateString('ru-RU')} ${dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
}

const MONTHS_SHORT = {
  uz: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
  ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
}
// Oy qisqa nomi (brauzer uz lokalini to'liq bilmaydi — "M05" chiqaradi)
export const monthShort = (monthIndex, lang = 'uz') => (MONTHS_SHORT[lang] || MONTHS_SHORT.uz)[monthIndex]
