import api from './client'

const map = (e) => ({
  id: String(e.id),
  name: e.name,
  username: e.username || '',
  role: e.role || 'employee',
  phone: e.phone || '',
  shopId: e.shopId ?? e.shop_id ?? '',
  permissions: e.permissions || [],
  access: e.access || null,
  salary: e.salary ?? 0,
  hiredAt: e.hiredAt ?? e.hired_at ?? '',
  isActive: e.isActive ?? e.is_active ?? true,
  deactivatedAt: e.deactivatedAt ?? e.deactivated_at ?? null,
  pendingDelete: e.pendingDelete ?? e.pending_delete ?? false,
  pendingDeleteAt: e.pendingDeleteAt ?? e.pending_delete_at ?? null,
  lastEditedBy: e.lastEditedBy ?? e.last_edited_by ?? null,
  isBlocked: e.isBlocked ?? e.is_blocked ?? false,
  blockedByAdmin: e.blockedByAdmin ?? e.blocked_by_admin ?? false,
  createdAt: e.createdAt ?? e.created_at ?? '',
})

// UI maydoni → server maydoni (faqat yuborilganlari — server qolganini o'zgartirmaydi)
const FIELDS = {
  name: 'name', username: 'username', password: 'password', role: 'role', phone: 'phone',
  shopId: 'shop_id', salary: 'salary', hiredAt: 'hired_at', isBlocked: 'is_blocked',
  pendingDelete: 'pending_delete', access: 'access',
}
const toBody = (patch) => {
  const body = {}
  for (const [k, col] of Object.entries(FIELDS)) {
    if (patch[k] === undefined) continue
    if (k === 'password' && !patch[k]) continue
    body[col] = ['shopId', 'username', 'phone', 'hiredAt'].includes(k) ? (patch[k] || null) : patch[k]
  }
  return body
}

export const getEmployees = async () => {
  const { data } = await api.get('/api/employees')
  return data.map(map)
}

export const createEmployee = async (emp) => {
  const { data } = await api.post('/api/employees', {
    name: emp.name,
    username: emp.username || null,
    password: emp.password || null,
    role: emp.role || 'employee',
    phone: emp.phone || null,
    shop_id: emp.shopId || null,
    salary: emp.salary || 0,
    hired_at: emp.hiredAt || null,
    access: emp.access || null,
  })
  return map(data)
}

// patch — faqat o'zgargan maydonlar (parol faqat yangi kiritilganda)
export const updateEmployee = async (id, patch) => {
  const { data } = await api.put(`/api/employees/${id}`, toBody(patch))
  return map(data)
}

export const requestEmployeeDelete = async (id) => {
  const { data } = await api.post(`/api/employees/${id}/request-delete`)
  return map(data)
}

export const deactivateEmployee = async (id) => {
  const { data } = await api.patch(`/api/employees/${id}/deactivate`)
  return map(data)
}

export const activateEmployee = async (id) => {
  const { data } = await api.patch(`/api/employees/${id}/activate`)
  return map(data)
}

export const deleteEmployee = async (id) => {
  await api.delete(`/api/employees/${id}`)
}
