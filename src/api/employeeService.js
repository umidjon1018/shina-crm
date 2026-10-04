import api from './client'

const map = (e) => ({
  id: String(e.id),
  name: e.name,
  username: e.username || '',
  password: e.password || '',
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
  createdAt: e.createdAt ?? e.created_at ?? '',
})

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
    permissions: emp.permissions || [],
    salary: emp.salary || 0,
    hired_at: emp.hiredAt || null,
    access: emp.access || null,
  })
  return map(data)
}

export const updateEmployee = async (id, emp) => {
  const { data } = await api.put(`/api/employees/${id}`, {
    name: emp.name,
    username: emp.username || null,
    password: emp.password || null,
    role: emp.role || 'employee',
    phone: emp.phone || null,
    shop_id: emp.shopId || null,
    permissions: emp.permissions || [],
    salary: emp.salary || 0,
    hired_at: emp.hiredAt || null,
    is_active: emp.isActive ?? true,
    pending_delete: emp.pendingDelete ?? false,
    pending_delete_at: emp.pendingDeleteAt || null,
    last_edited_by: emp.lastEditedBy || null,
    ...(emp.access !== undefined ? { access: emp.access } : {}),
  })
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
