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
