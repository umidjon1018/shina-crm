import api from './client'

const mapItem = (i) => ({
  id: String(i.id),
  itemId: String(i.item_id),
  productId: String(i.product_id),
  name: i.product_name || '',
  productName: i.product_name || '',
  productCategory: i.product_category || '',
  category: i.product_category || '',
  price: Number(i.price) || 0,
  salePrice: Number(i.price) || 0,
  purchasePrice: Number(i.purchase_price) || 0,
  barcode: i.barcode || null,
  saleId: String(i.sale_id),
})

const map = (s) => ({
  id: String(s.id),
  shopId: String(s.shop_id),
  customerId: s.customer_id ? String(s.customer_id) : null,
  customerName: s.customer_name || '',
  shopName: s.shop_name || '',
  sellerName: s.seller_name || '',
  userId: s.user_id ? String(s.user_id) : null,
  soldBy: s.user_id ? String(s.user_id) : null,
  soldByName: s.seller_name || '',
  soldAt: s.created_at || '',
  saleType: s.sale_type || 'cash',
  paymentType: s.sale_type || 'cash',
  subtotal: Number(s.total) || 0,
  total: Math.round((Number(s.total) || 0) * (1 - (Number(s.discount) || 0) / 100)),
  discount: Number(s.discount) || 0,
  status: s.status || 'completed',
  _isExchange: s.is_exchange || false,
  cancelledBy: s.cancelled_by ? String(s.cancelled_by) : null,
  cancelledByName: s.cancelled_by_name || null,
  cancelReason: s.cancel_reason || null,
  source: s.source || 'walk_in',
  notes: s.notes || '',
  installmentMonths: s.installment_months ? Number(s.installment_months) : null,
  installmentTermMonths: s.installment_months ? Number(s.installment_months) : null,
  installmentMonthly: s.installment_monthly ? Number(s.installment_monthly) : null,
  installmentOrg: s.installment_org || null,
  installmentOrgId: s.installment_org || null,
  installmentOrgName: s.installment_org_name || '',
  installmentCommissionPercent: Number(s.installment_commission_percent) || 0,
  installmentCommissionAmount: Number(s.installment_commission_amount) || 0,
  installmentDueDate: s.installment_due_date || null,
  contractNumber: s.contract_number || null,
  installmentDebt: s.installment_debt != null ? Number(s.installment_debt) : null,
  installmentPaidAmount: Number(s.installment_paid_amount) || 0,
  installmentPayments: Array.isArray(s.installment_payments) ? s.installment_payments : [],
  soldAt: s.created_at || '',
  createdAt: s.created_at || '',
  items: (s.items || []).map(mapItem),
})

export const getSales = async (shopId) => {
  const params = shopId && shopId !== 'all' ? { shop_id: shopId } : {}
  const { data } = await api.get('/api/sales', { params })
  const sales = data.map(map)
  // isNewCustomer: har bir mijoz uchun eng birinchi sotuv yangi hisoblanadi
  const firstSaleByCustomer = {}
  ;[...sales].sort((a, b) => a.soldAt.localeCompare(b.soldAt)).forEach(s => {
    if (s.customerId && !(s.customerId in firstSaleByCustomer)) {
      firstSaleByCustomer[s.customerId] = s.id
    }
  })
  return sales.map(s => ({
    ...s,
    isNewCustomer: s.customerId ? firstSaleByCustomer[s.customerId] === s.id : false,
  }))
}

export const createSale = async (saleData) => {
  const { data } = await api.post('/api/sales', {
    customer_id: saleData.customerId ? Number(saleData.customerId) : null,
    shop_id: saleData.shopId,
    sale_type: saleData.saleType || saleData.paymentType || 'cash',
    discount: saleData.discount || 0,
    items: (saleData.items || []).map(i => ({
      item_id: Number(i.itemId || i.id),
      price: i.price ?? i.salePrice,
    })),
    notes: saleData.notes,
    source: saleData.source || 'walk_in',
    installment_months: saleData.installmentMonths || saleData.installmentTermMonths,
    installment_monthly: saleData.installmentMonthly,
    installment_org: saleData.installmentOrg || saleData.installmentOrgId,
    installment_org_name: saleData.installmentOrgName || null,
    installment_commission_percent: saleData.installmentCommissionPercent || 0,
    installment_commission_amount: saleData.installmentCommissionAmount || 0,
    installment_due_date: saleData.installmentDueDate || null,
    contract_number: saleData.contractNumber || null,
  })
  return map(data)
}

export const cancelSale = async (id) => {
  await api.put(`/api/sales/${id}/cancel`)
}

export const makeInstallmentPayment = async (saleId, amount) => {
  const { data } = await api.post(`/api/sales/${saleId}/installment-payment`, { amount })
  return data
}
