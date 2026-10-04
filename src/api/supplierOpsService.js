import api from './client'
import { dayKey } from '../pages/Income/components/supShared'

const num = (v) => Number(v) || 0

const mapOrder = (o) => ({
  id: String(o.id),
  orderNumber: o.order_number || `#${o.id}`,
  supplierId: String(o.supplier_id),
  supplierName: o.supplier_name || '',
  shopId: String(o.shop_id),
  shopName: o.shop_name || '',
  status: o.status || 'draft',
  expectedDate: dayKey(o.expected_date),
  notes: o.notes || '',
  createdByName: o.created_by_name || '',
  createdAt: o.created_at || '',
  items: (o.items || []).map(i => ({
    id: String(i.id),
    productId: String(i.product_id),
    productName: i.product_name || '',
    productCategory: i.product_category || '',
    quantity: num(i.quantity),
    priceUSD: num(i.price_usd),
    unit: i.unit || 'dona',
    attributes: i.attributes || {},
    receivedQty: num(i.received_qty),
    rejectedQty: num(i.rejected_qty),
  })),
  payments: (o.payments || []).map(p => ({
    id: String(p.id),
    date: dayKey(p.date),
    amountUSD: num(p.amount_usd),
    usdRate: num(p.usd_rate),
    amountUZS: num(p.amount_uzs),
    type: p.type || 'cash_uzs',
    note: p.note || '',
    appliedUSD: num(p.applied_usd),
    createdByName: p.created_by_name || '',
  })),
  receipts: (o.receipts || []).map(r => ({
    id: String(r.id),
    receivedAt: r.received_at || '',
    receivedByName: r.received_by_name || '',
    entryUsdRate: num(r.entry_usd_rate),
    note: r.note || '',
    lines: (r.lines || []).map(l => ({
      itemId: String(l.item_id),
      productName: l.product_name || '',
      ordered: num(l.ordered),
      accepted: num(l.accepted),
      rejected: num(l.rejected),
      reason: l.reason || '',
      priceUSD: num(l.price_usd),
    })),
  })),
})

const toOrderBody = (f) => ({
  supplier_id: Number(f.supplierId),
  shop_id: Number(f.shopId),
  expected_date: f.expectedDate || null,
  notes: f.notes || null,
  status: f.status,
  items: f.items.map(i => ({
    product_id: Number(i.productId),
    quantity: Number(i.quantity),
    price_usd: Number(i.priceUSD) || 0,
    unit: i.unit || 'dona',
    attributes: i.attributes || {},
  })),
})

export const getPurchaseOrders = async (shopId) => {
  const params = shopId && shopId !== 'all' ? { shop_id: shopId } : {}
  const { data } = await api.get('/api/supplier-ops/orders', { params })
  return data.map(mapOrder)
}

export const createPurchaseOrder = async (form) => {
  const { data } = await api.post('/api/supplier-ops/orders', toOrderBody(form))
  return mapOrder(data)
}

export const updatePurchaseOrder = async (id, form) => {
  const { data } = await api.put(`/api/supplier-ops/orders/${id}`, toOrderBody(form))
  return mapOrder(data)
}

export const setPurchaseOrderStatus = async (id, status) => {
  const { data } = await api.patch(`/api/supplier-ops/orders/${id}/status`, { status })
  return mapOrder(data)
}

export const receivePurchaseOrder = async (id, { entryUsdRate, receivedAt, dueDate, note, lines }) => {
  const { data } = await api.post(`/api/supplier-ops/orders/${id}/receive`, {
    entry_usd_rate: Number(entryUsdRate),
    received_at: receivedAt || null,
    due_date: dueDate || null,
    note: note || null,
    lines: lines.map(l => ({
      item_id: Number(l.itemId),
      accepted_qty: Number(l.accepted) || 0,
      rejected_qty: Number(l.rejected) || 0,
      reason: l.reason || null,
      price_usd: l.priceUSD === '' || l.priceUSD == null ? null : Number(l.priceUSD),
    })),
  })
  return mapOrder(data)
}

export const addPurchaseOrderPayment = async (id, p) => {
  const { data } = await api.post(`/api/supplier-ops/orders/${id}/payments`, {
    date: p.date || null,
    amount_usd: Number(p.amountUSD),
    usd_rate: Number(p.usdRate),
    amount_uzs: Math.round(Number(p.amountUSD) * Number(p.usdRate)),
    type: p.type,
    note: p.note || null,
  })
  return mapOrder(data)
}

export const deletePurchaseOrderPayment = async (orderId, payId) => {
  const { data } = await api.delete(`/api/supplier-ops/orders/${orderId}/payments/${payId}`)
  return mapOrder(data)
}

export const paySupplierFIFO = async (supplierId, p) => {
  const { data } = await api.post(`/api/supplier-ops/suppliers/${supplierId}/pay`, {
    date: p.date || null,
    amount_usd: Number(p.amountUSD),
    usd_rate: Number(p.usdRate),
    type: p.type,
    note: p.note || null,
    shop_id: p.shopId && p.shopId !== 'all' ? Number(p.shopId) : null,
  })
  return data
}

const mapReturn = (r) => ({
  id: String(r.id),
  returnNumber: r.return_number || `#${r.id}`,
  supplierId: String(r.supplier_id),
  supplierName: r.supplier_name || '',
  shopId: r.shop_id != null ? String(r.shop_id) : '',
  shopName: r.shop_name || '',
  batchId: String(r.batch_id),
  batchNumber: r.batch_number || '',
  productId: r.product_id != null ? String(r.product_id) : '',
  productName: r.product_name || '',
  quantity: num(r.quantity),
  unitCostUSD: num(r.unit_cost_usd),
  amountUSD: num(r.amount_usd),
  usdRate: num(r.usd_rate),
  reason: r.reason || '',
  status: r.status || 'active',
  createdByName: r.created_by_name || '',
  createdAt: r.created_at || '',
})

export const getSupplierReturns = async (shopId) => {
  const params = shopId && shopId !== 'all' ? { shop_id: shopId } : {}
  const { data } = await api.get('/api/supplier-ops/returns', { params })
  return data.map(mapReturn)
}

export const createSupplierReturn = async ({ batchId, quantity, reason }) => {
  const { data } = await api.post('/api/supplier-ops/returns', {
    batch_id: Number(batchId), quantity: Number(quantity), reason,
  })
  return data
}

export const cancelSupplierReturn = async (id) => {
  const { data } = await api.patch(`/api/supplier-ops/returns/${id}/cancel`)
  return data
}
