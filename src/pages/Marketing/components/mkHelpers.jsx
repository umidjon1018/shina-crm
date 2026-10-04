import i18n from '../../../i18n'

export const fmtMoney = (n) => Math.round(Number(n) || 0).toLocaleString('uz-UZ') + ' ' + i18n.t('unit_som')
export const fmtD = (d) => {
  if (!d) return '—'
  const s = String(d)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { const [y, m, dd] = s.split('-'); return `${dd}.${m}.${y}` }
  const x = new Date(s)
  if (Number.isNaN(x.getTime())) return s
  return `${String(x.getDate()).padStart(2, '0')}.${String(x.getMonth() + 1).padStart(2, '0')}.${x.getFullYear()}`
}
export const fmtDT = (d) => {
  if (!d) return '—'
  const x = new Date(d)
  if (Number.isNaN(x.getTime())) return String(d)
  return `${fmtD(d)} ${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`
}

const targetText = (type, ids, t, products, categories) => {
  if (!type || type === 'all') return t('mkt_sum_all_goods')
  const names = ids.slice(0, 3).map(id => {
    if (type === 'product') { const p = products.find(x => String(x.id) === String(id)); return p ? [p.brand, p.name].filter(Boolean).join(' ') : id }
    if (type === 'category') { const c = categories.find(x => String(x.id) === String(id)); return c ? c.label : id }
    return id
  })
  const more = ids.length > 3 ? ` +${ids.length - 3}` : ''
  return ids.length ? `${names.join(', ')}${more}` : t('mkt_sum_not_selected')
}

const valueText = (p, t) => {
  if (p.discountType === 'amount') return `−${fmtMoney(p.discountValue)}`
  if (p.discountType === 'fixed_price') return t('mkt_sum_price', { price: fmtMoney(p.discountValue) })
  return `−${p.discountValue || 0}%`
}

// Aksiyaning tushunarli tavsifi (forma va ro'yxatda)
export const promoSummary = (p, t, products = [], categories = []) => {
  const target = targetText(p.targetType, p.targetIds || [], t, products, categories)
  let main = ''
  if (p.kind === 'discount') main = t('mkt_sum_discount', { target, value: valueText(p, t) }) + ((p.minQty || 1) > 1 ? ` (${t('mkt_sum_min_qty', { n: p.minQty })})` : '')
  else if (p.kind === 'gift') {
    const giftTarget = p.giftTargetType ? targetText(p.giftTargetType, p.giftTargetIds || [], t, products, categories) : t('mkt_sum_same_set')
    main = t('mkt_sum_gift', { buy: p.buyQty, get: p.getQty, target, gift: giftTarget, pct: (p.getDiscount ?? 100) >= 100 ? t('mkt_sum_free') : `−${p.getDiscount}%` })
  } else if (p.kind === 'carousel') main = t('mkt_sum_carousel', { target }) + ' ' + (p.tiers || []).map(x => `${x.qty} → ${x.percent}%`).join(', ')
  else if (p.kind === 'receipt') main = t('mkt_sum_receipt', { min: fmtMoney(p.minTotal || 0), value: valueText(p, t) })
  const c = p.conditions || {}
  const extra = []
  if (c.weekdays?.length) extra.push(c.weekdays.map(d => t('mkt_wd_' + d)).join(', '))
  if (c.timeFrom || c.timeTo) extra.push(`${c.timeFrom || '00:00'}–${c.timeTo || '23:59'}`)
  if (c.customer && c.customer !== 'any') extra.push(t('mkt_cust_' + c.customer) + (c.customer === 'group' && c.groups?.length ? `: ${c.groups.join(', ')}` : ''))
  if (c.excludeInstallment) extra.push(t('mkt_sum_no_installment'))
  if (p.requiresCode) extra.push(t('mkt_sum_code_only'))
  return [main, ...extra].join(' · ')
}

export const promoStatus = (p) => {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  if (!p.isActive) return 'off'
  if (p.endDate && p.endDate < today) return 'ended'
  if (p.startDate && p.startDate > today) return 'scheduled'
  return 'active'
}

export const STATUS_CLS = {
  active: 'bg-accent-green/10 text-accent-green',
  scheduled: 'bg-accent-blue/10 text-accent-blue',
  ended: 'bg-gray-500/10 text-gray-500',
  off: 'bg-gray-500/10 text-gray-500',
}
