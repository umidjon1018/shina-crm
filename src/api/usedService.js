import api from './client'

const mapStock = (r) => ({
  id: String(r.id),
  name: r.name,
  category: r.category,
  categoryLabel: r.category_label || r.categoryLabel || '',
  acquiredPrice: Number(r.acquired_price ?? r.acquiredPrice) || 0,
  replacedProductId: r.replaced_product_id ?? r.replacedProductId ?? null,
  replacedProductName: r.replaced_product_name ?? r.replacedProductName ?? null,
  replacedItemBarcode: r.replaced_item_barcode ?? r.replacedItemBarcode ?? null,
  customerId: (r.customer_id ?? r.customerId) != null ? String(r.customer_id ?? r.customerId) : null,
  customerName: r.customer_name ?? r.customerName ?? '',
  acquiredAt: r.acquired_at ?? r.acquiredAt ?? '',
  acquiredSaleId: r.acquired_sale_id ?? r.acquiredSaleId ?? null,
  employeeId: r.employee_id != null ? String(r.employee_id ?? r.employeeId) : null,
  employeeName: r.employee_name ?? r.employeeName ?? '',
  shopId: r.shop_id ?? r.shopId ?? 'shop1',
  status: r.status ?? 'in_stock',
  sellPrice: (r.sell_price ?? r.sellPrice) != null ? Number(r.sell_price ?? r.sellPrice) : null,
  soldAt: r.sold_at ?? r.soldAt ?? null,
  soldSaleId: (() => { const raw = r.soldSaleId ?? r.sold_sale_id; if (raw == null) return null; const s = String(raw); return s.startsWith('USED-SALE-') ? s : `USED-SALE-${s}` })(),
  scrapPrice: r.scrap_price != null ? Number(r.scrap_price ?? r.scrapPrice) : null,
  scrapBuyer: r.scrap_buyer ?? r.scrapBuyer ?? null,
  scrapNote: r.scrap_note ?? r.scrapNote ?? null,
  scrapAt: r.scrap_at ?? r.scrapAt ?? null,
  createdAt: r.created_at ?? r.createdAt ?? '',
})

const mapSale = (s) => ({
  ...s,
  id: s.id || `USED-SALE-${s._dbId}`,
  soldByName: s.soldByName || s.sellerName || '',
  installmentTermMonths: s.installmentTermMonths ?? null,
  installmentOrgId: s.installmentOrgId ?? null,
  installmentOrgName: s.installmentOrgName ?? null,
  isUsedSale: true,
})

export const getUsedStock = async (params = {}) => {
  const query = {}
  if (params.shopId && params.shopId !== 'all') query.shop_id = params.shopId
  if (params.status) query.status = params.status
  const { data } = await api.get('/api/used/stock', { params: query })
  return data.map(mapStock)
}

export const addUsedStockFromTradeIn = async (tradeIns, context = {}) => {
  const results = []
  for (const t of tradeIns) {
    const qty = t.qty || 1
    for (let i = 0; i < qty; i++) {
      const { data } = await api.post('/api/used/stock', {
        name: t.name,
        category: t.category || 'tire',
        category_label: t.categoryLabel || '',
        acquired_price: t.acquiredPrice || 0,
        replaced_product_id: context.replacedProductId || null,
        replaced_product_name: context.replacedProductName || null,
        replaced_item_barcode: context.replacedItemBarcode || null,
        customer_id: context.customerId ? Number(context.customerId) : null,
        customer_name: context.customerName || '',
        acquired_sale_id: context.saleId ? String(context.saleId) : null,
        employee_id: context.employeeId ? Number(context.employeeId) : null,
        employee_name: context.employeeName || '',
        shop_id: context.shopId || 'shop1',
        acquired_at: context.acquiredAt || new Date().toISOString(),
      })
      results.push(mapStock(data))
    }
  }
  return results
}

export const scrapUsedStock = async (id, data) => {
  const res = await api.patch(`/api/used/stock/${id}/scrap`, {
    scrap_price: data.scrapPrice ?? 0,
    scrap_buyer: data.scrapBuyer || null,
    note: data.note || null,
  })
  return { success: true, item: mapStock(res.data.item) }
}

export const getUsedSales = async (params = {}) => {
  const query = {}
  if (params.shopId && params.shopId !== 'all') query.shop_id = params.shopId
  const { data } = await api.get('/api/used/sales', { params: query })
  return data.map(mapSale)
}

export const createUsedSale = async (saleData) => {
const { data } = await api.post('/api/used/sales', {
    customer_id: saleData.customerId || null,
    customer_name: saleData.customerName || '',
    shop_id: saleData.shopId,
    payment_type: saleData.paymentType || 'cash',
    total: saleData.total || 0,
    discount: saleData.discount || 0,
    installment_debt: saleData.installmentDebt || 0,
    installment_due_date: saleData.installmentDueDate || null,
    installment_months: saleData.installmentTermMonths || null,
    installment_org: saleData.installmentOrgId || null,
    installment_org_name: saleData.installmentOrgName || null,
    notes: saleData.notes || null,
    source: saleData.source || null,
    items: (saleData.items || []).map(it => ({
      used_stock_id: Number(it.usedStockId),
      sale_price: it.salePrice || 0,
      acquired_price: it.acquiredPrice || 0,
      qty: it.qty || 1,
      name: it.name || '',
    })),
  })
  return { success: true, sale: mapSale(data) }
}

export const makeUsedInstallmentPayment = async (saleId, amount) => {
  const dbId = String(saleId).replace('USED-SALE-', '')
  const { data } = await api.post(`/api/used/sales/${dbId}/installment-payment`, { amount })
  return data
}

export const cancelUsedSale = async (saleId, payload = {}) => {
  const dbId = String(saleId).replace('USED-SALE-', '')
  await api.put(`/api/used/sales/${dbId}/cancel`, {
    cancel_reason: payload.cancelReason || null,
    refund_type: payload.refundType || null,
    cancelled_by: payload.cancelledBy || null,
    cancelled_by_name: payload.cancelledByName || null,
  })
  return { success: true }
}
