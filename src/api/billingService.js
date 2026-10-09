import api from './client'

// SICRM obunasi — do'kon admini (o'z obunasi) va super-admin (tariflar, mijozlar)
export const getBillingStatus = async () => (await api.get('/api/billing/status')).data
export const getBillingCatalog = async () => (await api.get('/api/billing/catalog')).data
export const getBillingQuote = async (body) => (await api.post('/api/billing/quote', body)).data
export const createBillingInvoice = async (body) => (await api.post('/api/billing/invoices', body)).data
export const getBillingInvoices = async () => (await api.get('/api/billing/invoices')).data
export const getBillingInvoice = async (id) => (await api.get(`/api/billing/invoices/${id}`)).data

export const getBillingAdmin = async () => (await api.get('/api/billing/admin/overview')).data
export const saveBillingPlan = async (code, body) => (await api.put(`/api/billing/admin/plans/${encodeURIComponent(code)}`, body)).data
export const saveBillingAddon = async (code, body) => (await api.put(`/api/billing/admin/addons/${encodeURIComponent(code)}`, body)).data
export const saveBillingSettings = async (body) => (await api.put('/api/billing/admin/settings', body)).data
export const saveBillingTenant = async (slug, body) => (await api.put(`/api/billing/admin/tenants/${encodeURIComponent(slug)}`, body)).data
export const getBillingAdminInvoices = async () => (await api.get('/api/billing/admin/invoices')).data
export const markBillingInvoicePaid = async (id) => (await api.post(`/api/billing/admin/invoices/${id}/mark-paid`)).data
