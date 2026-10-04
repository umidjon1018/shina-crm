import api from './client'

export const checkReservation = async (itemId) => {
  try {
    const r = await api.get(`/api/reservations/check/${itemId}`)
    return r.data
  } catch {
    return { reserved: false }
  }
}

// itemId yoki productId (+shopId) — productId da tizim bo'sh barkodli birlikni o'zi tanlaydi
export const createReservation = async ({ itemId, productId, shopId, customerName, customerPhone, reservedUntil, notes }) => {
  const r = await api.post('/api/reservations', { itemId, productId, shopId, customerName, customerPhone, reservedUntil, notes })
  return r.data
}

export const getReservations = async (shopId) => {
  const r = await api.get('/api/reservations', { params: shopId && shopId !== 'all' ? { shop_id: shopId } : {} })
  return r.data
}

// Faol bronlangan item id lari — sotuvda boshqa mijozga tushib qolmasligi uchun
export const getReservedItemIds = async () => {
  try {
    return new Set((await getReservations()).map(r => String(r.item_id)))
  } catch {
    return new Set()
  }
}

export const cancelReservation = async (id) => {
  const r = await api.patch(`/api/reservations/${id}/cancel`)
  return r.data
}
