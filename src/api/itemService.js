import api from './client'

const mapItem = (i) => ({
  id: String(i.id),
  batchId: String(i.batch_id),
  productId: String(i.product_id),
  shopId: String(i.shop_id),
  barcode: i.barcode || null,
  barcodeStatus: i.barcode_status || null,
  barcodeCreatedAt: i.barcode_created_at || null,
  reprintAllowed: i.reprint_allowed || false,
  printCount: Number(i.print_count) || 0,
  downloadCount: Number(i.download_count) || 0,
  status: i.status || 'in_stock',
  soldAt: i.sold_at || null,
  createdAt: i.created_at || '',
  productName: i.product_name || '',
  productCategory: i.product_category || '',
  batchNumber: i.batch_number || '',
  purchasePrice: Number(i.purchase_price) || 0,
  purchasePriceUSD: Number(i.purchase_price_usd) || 0,
})

export const getItems = async (params = {}) => {
  const query = {}
  if (params.shopId && params.shopId !== 'all') query.shop_id = params.shopId
  if (params.productId) query.product_id = params.productId
  if (params.status) query.status = params.status
  const { data } = await api.get('/api/items', { params: query })
  return data.map(mapItem)
}

export const generateBarcodes = async (itemIds, userId) => {
  const { data } = await api.post('/api/items/generate-barcodes', {
    item_ids: itemIds.map(Number),
    user_id: userId,
  })
  return data.map(mapItem)
}

export const updateBarcodeStatus = async (itemIds, statusOrObj) => {
  const payload = { item_ids: itemIds.map(Number) }
  if (typeof statusOrObj === 'string') {
    payload.status = statusOrObj
  } else if (statusOrObj && typeof statusOrObj === 'object') {
    if (statusOrObj.reprintAllowed !== undefined) payload.reprint_allowed = statusOrObj.reprintAllowed
    if (statusOrObj.status !== undefined) payload.status = statusOrObj.status
  }
  await api.patch('/api/items/barcode-status', payload)
}

export const findItemByBarcode = async (barcode) => {
  try {
    const { data } = await api.get(`/api/items/barcode/${encodeURIComponent(barcode)}`)
    const item = mapItem(data)
    const product = {
      id: String(data.product_id),
      name: data.product_name || '',
      brand: data.product_brand || '',
      category: data.product_category || '',
      sku: data.sku || '',
      size: data.size || '',
      season: data.season || 'NA',
      cashPrice: Number(data.cash_price) || 0,
      minSalePrice: Number(data.min_sale_price) || 0,
      installmentBasePrice: Number(data.installment_base_price) || 0,
      warrantyDays: data.warranty_days ? Number(data.warranty_days) : null,
    }
    return { item, product }
  } catch {
    return null
  }
}
