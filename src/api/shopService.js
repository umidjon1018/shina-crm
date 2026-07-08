import api from './client'

const map = (s) => ({
  id: String(s.id),
  name: s.name,
  address: s.address || '',
  isActive: s.is_active ?? true,
  googleMapLink: s.google_map_link || '',
  yandexMapLink: s.yandex_map_link || '',
  openTime: s.open_time || '08:00',
  closeTime: s.close_time || '22:00',
  managerId: s.manager_id || '',
  createdAt: s.created_at ? s.created_at.split('T')[0] : '',
})

export const getShops = async () => {
  const { data } = await api.get('/api/shops')
  return data.map(map)
}

export const createShop = async (shopData) => {
  const { data } = await api.post('/api/shops', {
    name: shopData.name,
    address: shopData.address || null,
    google_map_link: shopData.googleMapLink || null,
    yandex_map_link: shopData.yandexMapLink || null,
    open_time: shopData.openTime || '08:00',
    close_time: shopData.closeTime || '22:00',
    manager_id: shopData.managerId || null,
  })
  return map(data)
}

export const updateShop = async (id, shopData) => {
  const { data } = await api.put(`/api/shops/${id}`, {
    name: shopData.name,
    address: shopData.address || null,
    is_active: shopData.isActive ?? true,
    google_map_link: shopData.googleMapLink || null,
    yandex_map_link: shopData.yandexMapLink || null,
    open_time: shopData.openTime || '08:00',
    close_time: shopData.closeTime || '22:00',
    manager_id: shopData.managerId || null,
  })
  return map(data)
}

export const deleteShop = async (id) => {
  await api.delete(`/api/shops/${id}`)
}
