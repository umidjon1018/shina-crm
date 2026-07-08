import api from './client'

const mapReturn = (r) => ({
  id: r.id,
  shopId: r.shopId ?? r.shop_id,
  type: r.type,
  originalSaleId: r.originalSaleId ?? r.original_sale_id,
  customerId: r.customerId ?? (r.customer_id ? String(r.customer_id) : null),
  customerName: r.customerName ?? r.customer_name ?? '',
  returnedItems: r.returnedItems ?? [],
  exchangedForItems: r.exchangedForItems ?? [],
  exchangedForItem: (r.exchangedForItems ?? [])[0] ?? r.exchangedForItem ?? null,
  refundAmount: Number(r.refundAmount ?? r.refund_amount) || 0,
  additionalPayment: Number(r.additionalPayment ?? r.additional_payment) || 0,
  paymentMethod: r.paymentMethod ?? r.payment_method ?? 'cash',
  soldAt: r.soldAt ?? r.sold_at ?? null,
  returnedAt: r.returnedAt ?? r.returned_at ?? '',
  soldBy: r.soldBy ?? r.sold_by ?? null,
  soldByName: r.soldByName ?? r.sold_by_name ?? '',
  processedBy: r.processedBy ?? r.processed_by ?? null,
  processedByName: r.processedByName ?? r.processed_by_name ?? '',
  status: r.status ?? 'completed',
  returnReason: r.returnReason ?? r.return_reason ?? null,
  exchangeSaleId: r.exchangeSaleId ?? r.exchange_sale_id ?? null,
  _isExchange: r._isExchange ?? r.is_exchange ?? false,
  notes: r.notes ?? null,
})

export const getReturns = async () => {
  try {
    const { data } = await api.get('/api/returns')
    return data.map(mapReturn)
  } catch { return [] }
}

export const addReturn = async (ret) => {
  const { data } = await api.post('/api/returns', {
    id: ret.id || null,
    shop_id: ret.shopId,
    type: ret.type,
    original_sale_id: ret.originalSaleId,
    customer_id: ret.customerId || null,
    customer_name: ret.customerName || '',
    returned_items: (ret.returnedItems || []).map(i => ({
      itemId: i.itemId, barcode: i.barcode, productId: i.productId,
      name: i.name, salePrice: i.salePrice, qty: i.qty || 1,
    })),
    exchanged_for_items: (ret.exchangedForItems || (ret.exchangedForItem ? [ret.exchangedForItem] : [])).map(i => ({
      itemId: i.itemId, barcode: i.barcode, productId: i.productId,
      name: i.name, salePrice: i.salePrice || i.price, qty: i.qty || 1,
    })),
    refund_amount: ret.refundAmount || 0,
    additional_payment: ret.additionalPayment || 0,
    payment_method: ret.paymentMethod || 'cash',
    sold_at: ret.soldAt || null,
    sold_by: ret.soldBy || null,
    sold_by_name: ret.soldByName || '',
    processed_by: ret.processedBy || null,
    processed_by_name: ret.processedByName || '',
    return_reason: ret.returnReason || null,
    exchange_sale_id: ret.exchangeSaleId || null,
    is_exchange: ret._isExchange || false,
    notes: ret.notes || null,
  })
  return mapReturn(data)
}
