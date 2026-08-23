import api from './client'

const map = (p) => ({
  id: String(p.id),
  name: p.name,
  category: p.category,
  categoryLabel: p.category === 'tire' ? 'Shina' : p.category === 'wheel' ? 'Disk' : 'Aksessuar',
  brand: p.brand || '',
  country: p.country || '',
  size: p.size || '',
  sku: p.sku || '',
  season: p.season || 'NA',
  seasonLabel: { SUMMER: 'Yoz', WINTER: 'Qish', ALL_SEASON: 'Butun yil', NA: '—' }[p.season] || '—',
  cashPrice: Number(p.cash_price) || 0,
  minSalePrice: Number(p.min_sale_price) || 0,
  installmentBasePrice: Number(p.installment_base_price) || 0,
  purchasePrice: Number(p.purchase_price) || 0,
  lowStockThreshold: Number(p.low_stock_threshold) || 3,
  warrantyDays: p.warranty_days ? Number(p.warranty_days) : null,
  attribute: p.attribute || '',
  carCategory: p.car_category || '',
  notes: p.notes || '',
  installmentMonths: Array.isArray(p.installment_months) ? p.installment_months : [],
  isActive: p.is_active,
  // Stock (backend dan)
  totalStock: Number(p.stock_count) || 0,
  barcodeReadyStock: Number(p.barcode_ready_stock) || 0,
  noBarcodeCount: Number(p.no_barcode_count) || 0,
  // mock compat fields
  installment3m: 0,
  installment6m: 10,
  installment12m: 15,
  totalSold: 0,
  dailySalesRate: 0,
})

export const getProducts = async () => {
  const { data } = await api.get('/api/products')
  return data.map(map)
}

export const createProduct = async (productData) => {
  try {
    const { data } = await api.post('/api/products', {
      name: productData.name,
      category: productData.category,
      cash_price: productData.cashPrice,
      min_sale_price: productData.minSalePrice,
      installment_base_price: productData.installmentBasePrice,
      purchase_price: productData.purchasePrice,
      season: productData.season,
      brand: productData.brand,
      country: productData.country,
      size: productData.size,
      sku: productData.sku,
      low_stock_threshold: productData.lowStockThreshold,
      warranty_days: productData.warrantyDays,
      attribute: productData.attribute,
      car_category: productData.carCategory,
      notes: productData.notes,
    })
    return map(data)
  } catch (err) {
    if (err?.response?.status === 409 && err.response.data?.product) {
      return map(err.response.data.product)
    }
    throw err
  }
}

export const updateProduct = async (id, productData) => {
  const { data } = await api.put(`/api/products/${id}`, {
    name: productData.name,
    category: productData.category,
    cash_price: productData.cashPrice,
    min_sale_price: productData.minSalePrice,
    installment_base_price: productData.installmentBasePrice,
    purchase_price: productData.purchasePrice,
    season: productData.season,
    brand: productData.brand,
    country: productData.country,
    size: productData.size,
    sku: productData.sku,
    low_stock_threshold: productData.lowStockThreshold,
    warranty_days: productData.warrantyDays,
    attribute: productData.attribute,
    car_category: productData.carCategory,
    notes: productData.notes,
    installment_months: productData.installmentMonths || null,
  })
  return map(data)
}

export const deleteProduct = async (id) => {
  await api.delete(`/api/products/${id}`)
}

export const updateProductPrice = async (id, { cashPrice, minSalePrice }) => {
  const { data } = await api.put(`/api/products/${id}`, {
    cash_price: cashPrice,
    min_sale_price: minSalePrice,
  })
  return map(data)
}

export const bulkUpdatePrices = async (updates) => {
  // updates: [{ id, cashPrice?, minSalePrice?, installmentBasePrice? }]
  await Promise.all(updates.map(({ id, cashPrice, minSalePrice, installmentBasePrice }) =>
    api.put(`/api/products/${id}`, {
      ...(cashPrice !== undefined && { cash_price: cashPrice }),
      ...(minSalePrice !== undefined && { min_sale_price: minSalePrice }),
      ...(installmentBasePrice !== undefined && { installment_base_price: installmentBasePrice }),
    })
  ))
}
