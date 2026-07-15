import api from './client'

export const checkReservation = async (itemId) => {
  try {
    const r = await api.get(`/reservations/check/${itemId}`)
    return r.data
  } catch {
    return { reserved: false }
  }
}

export const createReservation = async ({ itemId, productId, customerName, customerPhone, reservedUntil, notes }) => {
  const r = await api.post('/reservations', { itemId, productId, customerName, customerPhone, reservedUntil, notes })
  return r.data
}

export const getReservations = async () => {
  const r = await api.get('/reservations')
  return r.data
}

export const cancelReservation = async (id) => {
  const r = await api.patch(`/reservations/${id}/cancel`)
  return r.data
}
