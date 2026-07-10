export const getSaleProfit = (s) => {
  if (!s || !s.items) return 0
  return s.items.reduce((acc, it) => {
    const purchasePrice = it.purchasePrice || 0
    const salePrice = it.price || it.salePrice || 0
    const salePriceAfterDiscount = Math.round(salePrice * (1 - (s.discount || 0) / 100))
    return acc + (salePriceAfterDiscount - purchasePrice) * (it.qty || 1)
  }, 0)
}

export const getUsedSaleProfit = (s, usedStock = []) => {
  if (!s || !s.items) return 0
  return s.items.reduce((acc, it) => {
    const stockItem = usedStock.find(u => u.id === it.usedStockId)
    const acquiredPrice = stockItem?.acquiredPrice ?? it.acquiredPrice ?? 0
    const salePriceAfterDiscount = Math.round((it.salePrice || 0) * (1 - (s.discount || 0) / 100))
    return acc + (salePriceAfterDiscount - acquiredPrice) * (it.qty || 1)
  }, 0)
}
