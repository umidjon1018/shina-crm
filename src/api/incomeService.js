import api from './client'

// ===================== BATCHES =====================
const mapBatch = (b) => ({
  id: String(b.id),
  shopId: String(b.shop_id),
  batchId: String(b.id),
  productId: String(b.product_id),
  supplierId: b.supplier_id ? String(b.supplier_id) : null,
  supplierName: b.supplier_name || '',
  productName: b.product_name || '',
  productCategory: b.product_category || '',
  shopName: b.shop_name || '',
  batchNumber: b.batch_number || '',
  quantity: Number(b.quantity_in) || 0,
  quantityIn: Number(b.quantity_in) || 0,
  quantityRemaining: Number(b.quantity_remaining) || 0,
  purchasePrice: Number(b.purchase_price) || 0,
  purchasePriceUSD: Number(b.purchase_price_usd) || 0,
  entryUsdRate: Number(b.entry_usd_rate) || 0,
  totalUSD: Number(b.total_usd) || 0,
  totalUZS_atEntry: Number(b.total_uzs_at_entry) || 0,
  paymentStatus: b.payment_status || 'unpaid',
  paidUSD: Number(b.paid_usd) || 0,
  debtUSD: Number(b.debt_usd) || 0,
  dueDate: b.due_date || null,
  notes: b.notes || null,
  promoDiscount: b.promo_discount ? Number(b.promo_discount) : null,
  promoNote: b.promo_note || null,
  receivedAt: b.received_at || b.created_at || '',
  receivedByName: b.received_by_name || '',
  payments: (b.payments || []).map(p => ({
    id: String(p.id),
    date: p.date || '',
    amountUSD: Number(p.amount_usd) || 0,
    usdRate: Number(p.usd_rate) || 1,
    amountUZS: Number(p.amount_uzs) || 0,
    type: p.type || 'cash_uzs',
    note: p.note || '',
    noteRu: p.note_ru || '',
  })),
})

export const getIncomeBatches = async (shopId) => {
  const params = shopId && shopId !== 'all' ? { shop_id: shopId } : {}
  const { data } = await api.get('/api/batches', { params })
  return data.map(mapBatch)
}

export const addBatch = async (batchData) => {
  const { data } = await api.post('/api/batches', {
    product_id: Number(batchData.productId),
    supplier_id: batchData.supplierId || null,
    shop_id: batchData.shopId,
    quantity_in: batchData.quantityIn || batchData.quantity,
    purchase_price: batchData.purchasePrice,
    purchase_price_usd: batchData.purchasePriceUSD,
    entry_usd_rate: batchData.entryUsdRate,
    payment_status: batchData.paymentStatus === 'credit' ? 'unpaid' : (batchData.paymentStatus || 'unpaid'),
    paid_usd: batchData.paidUSD,
    due_date: batchData.dueDate,
    notes: batchData.notes,
    promo_discount: batchData.promoDiscount,
    promo_note: batchData.promoNote,
  })
  return mapBatch(data)
}

export const updateBatch = async (id, batchData) => {
  const { data } = await api.put(`/api/batches/${id}`, {
    supplier_id: batchData.supplierId || null,
    quantity_in: batchData.quantity,
    purchase_price: batchData.purchasePrice,
    purchase_price_usd: batchData.purchasePriceUSD,
    entry_usd_rate: batchData.entryUsdRate,
    payment_status: batchData.paymentStatus,
    due_date: batchData.dueDate || null,
    notes: batchData.notes || null,
    promo_discount: batchData.promoDiscount || null,
    promo_note: batchData.promoNote || null,
  })
  return mapBatch(data)
}

export const addPaymentToBatch = async (batchId, paymentData) => {
  const { data } = await api.post(`/api/batches/${batchId}/payments`, {
    date: paymentData.date,
    amount_usd: paymentData.amountUSD,
    usd_rate: paymentData.usdRate,
    amount_uzs: paymentData.amountUZS,
    type: paymentData.type,
    note: paymentData.note,
  })
  return data
}

export const deletePaymentFromBatch = async (batchId, paymentId) => {
  await api.delete(`/api/batches/${batchId}/payments/${paymentId}`)
}

// ===================== SUPPLIERS =====================
const mapSupplier = (s) => ({
  id: String(s.id),
  name: s.name,
  phone: s.phone || '',
  address: s.address || '',
  contactPerson: s.contact_person || '',
  notes: s.notes || '',
  inn: s.inn || '',
  contractNumber: s.contract_number || '',
  contractAmount: Number(s.contract_amount) || 0,
  isActive: s.is_active,
  createdAt: s.created_at || '',
  // mock compat
  totalBatches: 0,
  totalDebtUSD: 0,
})

export const getSuppliers = async () => {
  const { data } = await api.get('/api/suppliers')
  return data.map(mapSupplier)
}

export const addSupplier = async (supplierData) => {
  const { data } = await api.post('/api/suppliers', {
    name: supplierData.name,
    phone: supplierData.phone,
    address: supplierData.address,
    contact_person: supplierData.contactPerson,
    notes: supplierData.notes,
    inn: supplierData.inn,
    contract_number: supplierData.contractNumber,
    contract_amount: supplierData.contractAmount || null,
  })
  return mapSupplier(data)
}

export const updateSupplier = async (id, supplierData) => {
  const { data } = await api.put(`/api/suppliers/${id}`, {
    name: supplierData.name,
    phone: supplierData.phone,
    address: supplierData.address,
    contact_person: supplierData.contactPerson,
    notes: supplierData.notes,
    inn: supplierData.inn,
    contract_number: supplierData.contractNumber,
    contract_amount: supplierData.contractAmount || null,
  })
  return mapSupplier(data)
}

export const deleteSupplier = async (id) => {
  const { data } = await api.delete(`/api/suppliers/${id}`)
  return data
}

export const linkBatchToSupplier = async (batchId, supplierId) => {
  await api.patch(`/api/batches/${batchId}/supplier`, { supplier_id: supplierId })
  return { success: true }
}
