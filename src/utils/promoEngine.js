// Kassadagi avtomatik aksiyalar: har bir savat qatori uchun aksiya narxini hisoblaydi.
// Tovar aksiyalari (chegirma/narx, N+M, karusel) bir-biri bilan qo'shilmaydi — har tovarga eng foydali bittasi.
// Chek aksiyasi (summa X dan oshsa) tovar aksiyalaridan keyin qolgan summaga qo'llanadi.

const pad = (n) => String(n).padStart(2, '0')
const localDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const lineBase = (c) => (c.salePrice !== null && c.salePrice !== undefined ? c.salePrice : c.product.cashPrice) || 0

const matches = (product, type, ids) => {
  if (!type || type === 'all') return true
  const set = (ids || []).map(String)
  if (type === 'product') return set.includes(String(product.id))
  if (type === 'category') return set.includes(String(product.category))
  if (type === 'brand') return set.map(s => s.toLowerCase()).includes(String(product.brand || '').toLowerCase())
  return false
}

const daysToBirthday = (birthDate, now) => {
  if (!birthDate) return null
  const [, m, d] = String(birthDate).slice(0, 10).split('-').map(Number)
  if (!m || !d) return null
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = (y) => Math.round((new Date(y, m - 1, d) - today) / 86400000)
  return Math.min(...[diff(now.getFullYear() - 1), diff(now.getFullYear()), diff(now.getFullYear() + 1)].map(Math.abs))
}

// Shartlar: sana, do'kon, hafta kuni, soat, mijoz, to'lov turi
export const promoEligible = (p, ctx) => {
  const now = ctx.now || new Date()
  const today = localDate(now)
  if (!p.isActive) return false
  if (p.startDate && p.startDate > today) return false
  if (p.endDate && p.endDate < today) return false
  if (p.shopId && p.shopId !== 'all' && ctx.shopId && ctx.shopId !== 'all' && String(p.shopId) !== String(ctx.shopId)) return false
  const c = p.conditions || {}
  if (Array.isArray(c.weekdays) && c.weekdays.length && !c.weekdays.includes(now.getDay())) return false
  const hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`
  if (c.timeFrom && hm < c.timeFrom) return false
  if (c.timeTo && hm > c.timeTo) return false
  if (c.excludeInstallment && ctx.paymentType === 'installment') return false
  const cust = ctx.customer
  if (c.customer === 'registered' && !cust?.id) return false
  if (c.customer === 'new' && (!cust?.id || (ctx.customerPurchases || 0) > 0)) return false
  if (c.customer === 'group' && (!cust?.id || !(c.groups || []).includes(cust.group || cust.customerGroup || ''))) return false
  if (c.customer === 'birthday') {
    const dd = daysToBirthday(cust?.birthDate, now)
    if (dd === null || dd > (c.birthdayDays ?? 3)) return false
  }
  return true
}

const reductionFor = (p, base) => {
  const v = Number(p.discountValue) || 0
  if (p.discountType === 'amount') return Math.min(base, v)
  if (p.discountType === 'fixed_price') return Math.max(0, base - v)
  return base * Math.min(100, v) / 100
}

// Bitta aksiya bo'yicha nomzod: { reductions: Map(lineKey → summa), involved: Set }
const candidate = (p, lines) => {
  const reductions = new Map()
  const involved = new Set()
  const target = lines.filter(l => matches(l.product, p.targetType, p.targetIds))
  if (p.kind === 'discount') {
    if (target.length < (p.minQty || 1)) return null
    target.forEach(l => { const r = reductionFor(p, l.base); if (r > 0) { reductions.set(l.key, r); involved.add(l.key) } })
  } else if (p.kind === 'carousel') {
    const n = target.length
    const tier = [...(p.tiers || [])].filter(t => t.qty <= n).sort((a, b) => b.qty - a.qty)[0]
    if (!tier) return null
    target.forEach(l => { reductions.set(l.key, l.base * Math.min(100, tier.percent) / 100); involved.add(l.key) })
  } else if (p.kind === 'gift') {
    const buy = p.buyQty || 0, get = p.getQty || 0
    if (!(buy > 0 && get > 0)) return null
    const pct = Math.min(100, p.getDiscount ?? 100) / 100
    // Sotib olinadiganlar — qimmatidan, sovg'alar — arzonidan tanlanadi (to'plamlar ustma-ust tushsa ham ishlaydi)
    const buyers = [...target].sort((a, b) => b.base - a.base)
    const giftPool = (p.giftTargetType ? lines.filter(l => matches(l.product, p.giftTargetType, p.giftTargetIds)) : target)
      .slice().sort((a, b) => a.base - b.base)
    const used = new Set()
    for (;;) {
      const bs = buyers.filter(l => !used.has(l.key)).slice(0, buy)
      if (bs.length < buy) break
      bs.forEach(l => used.add(l.key))
      const gs = giftPool.filter(l => !used.has(l.key)).slice(0, get)
      if (gs.length < get) { bs.forEach(l => used.delete(l.key)); break }
      gs.forEach(l => { used.add(l.key); reductions.set(l.key, l.base * pct) })
    }
    if (!reductions.size) return null
    used.forEach(k => involved.add(k))
  } else if (p.kind === 'bundle') {
    const req = (p.bundleItems || []).filter(b => b.productId && b.qty > 0)
    if (!req.length) return null
    const pools = req.map(b => ({ qty: b.qty, lines: lines.filter(l => String(l.product.id) === String(b.productId)).sort((a, c) => c.base - a.base) }))
    const sets = Math.min(...pools.map(x => Math.floor(x.lines.length / x.qty)))
    if (!(sets > 0)) return null
    for (let i = 0; i < sets; i++) {
      const setLines = pools.flatMap(x => x.lines.slice(i * x.qty, (i + 1) * x.qty))
      const setBase = setLines.reduce((s, l) => s + l.base, 0)
      if (!(setBase > 0)) continue
      const off = Math.min(setBase, reductionFor(p, setBase))
      setLines.forEach(l => { reductions.set(l.key, off * l.base / setBase); involved.add(l.key) })
    }
    if (!reductions.size) return null
  } else {
    return null
  }
  const total = [...reductions.values()].reduce((s, r) => s + r, 0)
  return total > 0 ? { promo: p, reductions, involved, total } : null
}

// cart: cartItems; promos: aksiyalar ro'yxati; codePromoIds: kiritilgan promokod(lar) aksiya id → kod
export const evaluatePromotions = ({ cart, promos, ctx = {}, codePromos = {} }) => {
  const lines = cart
    .map(c => ({ key: c.item.id, product: c.product, base: lineBase(c) }))
  const eligible = (promos || []).filter(p =>
    (!p.requiresCode || codePromos[String(p.id)]) && promoEligible(p, ctx))

  const itemPromos = eligible.filter(p => p.kind !== 'receipt')
  const cands = itemPromos.map(p => candidate(p, lines)).filter(Boolean).sort((a, b) => b.total - a.total)
  const taken = new Map() // lineKey → { reduction, promo }
  for (const cd of cands) {
    if (cd.promo.kind === 'gift' || cd.promo.kind === 'bundle') {
      if ([...cd.involved].some(k => taken.has(k))) continue
      cd.involved.forEach(k => taken.set(k, { reduction: cd.reductions.get(k) || 0, promo: cd.promo }))
    } else {
      cd.reductions.forEach((r, k) => { if (!taken.has(k)) taken.set(k, { reduction: r, promo: cd.promo }) })
    }
  }

  const result = new Map()
  lines.forEach(l => {
    const t = taken.get(l.key)
    const reduction = t ? Math.min(l.base, Math.round(t.reduction)) : 0
    result.set(l.key, { base: l.base, price: l.base - reduction, reduction, promo: t && reduction > 0 ? t.promo : null })
  })

  // Chek aksiyasi
  const afterItems = [...result.values()].reduce((s, r) => s + r.price, 0)
  const receiptCands = eligible.filter(p => p.kind === 'receipt' && afterItems > 0 && afterItems >= (p.minTotal || 0))
    .map(p => ({ promo: p, amount: Math.round(Math.min(afterItems, reductionFor(p, afterItems))) }))
    .filter(r => r.amount > 0)
    .sort((a, b) => b.amount - a.amount)
  let receipt = null
  if (receiptCands.length) {
    receipt = receiptCands[0]
    const entries = [...result.entries()].filter(([, r]) => r.price > 0)
    let left = receipt.amount
    entries.forEach(([k, r], i) => {
      const part = i === entries.length - 1 ? left : Math.min(left, Math.round(receipt.amount * r.price / afterItems))
      left -= part
      result.set(k, { ...r, price: r.price - part, receiptPart: part })
    })
  }

  const byPromo = new Map()
  result.forEach(r => {
    if (r.promo && r.reduction > 0) {
      const e = byPromo.get(r.promo.id) || { promoId: r.promo.id, name: r.promo.name, kind: r.promo.kind, amount: 0, stackable: r.promo.stackable, code: codePromos[String(r.promo.id)] || null }
      e.amount += r.reduction
      byPromo.set(r.promo.id, e)
    }
  })
  if (receipt) {
    byPromo.set(receipt.promo.id, {
      promoId: receipt.promo.id, name: receipt.promo.name, kind: 'receipt', amount: receipt.amount,
      stackable: receipt.promo.stackable, code: codePromos[String(receipt.promo.id)] || null,
    })
  }
  const applied = [...byPromo.values()]
  const totalReduction = applied.reduce((s, a) => s + a.amount, 0)
  return {
    lines: result,
    applied,
    totalReduction,
    blocksManualDiscount: applied.some(a => !a.stackable),
  }
}
