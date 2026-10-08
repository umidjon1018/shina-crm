export const getSaleProfit = (s) => {
  if (!s || !s.items) return 0
  const totalCost = s.items.reduce((acc, it) => acc + (it.purchasePrice || 0) * (it.qty || 1), 0)
  return (s.total || 0) - totalCost
}

// Hisobotlardagi yagona formula: tannarx va nasiya komissiyasi ayirilgan foyda
export const getNetSaleProfit = (s) =>
  getSaleProfit(s) - (s?.paymentType === 'installment' ? (s.installmentCommissionAmount ?? 0) : 0)

// Almashtirish uchun bekor qilingan sotuv (pul qaytarilmagan). Eski sotuvda faqat cancel_reason='exchange'
// bo'ladi; is_exchange esa almashtirishdan YARATILGAN yangi sotuvga qo'yiladi
export const isExchangeCancel = (s) =>
  s?.status === 'cancelled' && (s.cancelReason === 'exchange' || s.cancelReason === 'almashtirish' || !!s._isExchange)

export const getUsedSaleProfit = (s, usedStock = []) => {
  if (!s || !s.items) return 0
  const totalCost = s.items.reduce((acc, it) => {
    const stockItem = usedStock.find(u => u.id === it.usedStockId)
    const acquiredPrice = stockItem?.acquiredPrice ?? it.acquiredPrice ?? 0
    return acc + acquiredPrice * (it.qty || 1)
  }, 0)
  return (s.total || 0) - totalCost
}

// Sotuvdagi har tovarning foydasi: o'z sotuv narxi (foizli chegirma ulushi bilan) − o'z kirim narxi − nasiya komissiyasi ulushi.
// Sotuv foydasini tovarlar soniga teng bo'lish noto'g'ri (shina va qopqoq bir xil foyda olib qolardi)
export const getSaleItemProfits = (s) => {
  const items = s?.items || []
  const gross = items.reduce((a, it) => a + (it.price || it.salePrice || 0) * (it.qty || 1), 0)
  const ratio = gross > 0 ? (s.total || 0) / gross : 1
  const commission = s?.paymentType === 'installment' ? (s.installmentCommissionAmount ?? 0) : 0
  return items.map(it => {
    const qty = it.qty || 1
    const revenue = (it.price || it.salePrice || 0) * qty * ratio
    const cost = (it.purchasePrice || 0) * qty
    const commissionShare = s.total > 0 ? commission * revenue / s.total : 0
    return { name: it.name || it.productName || '', productId: it.productId, qty, revenue, cost,
      profit: revenue - cost - commissionShare, missingCost: !it.purchasePrice }
  })
}
