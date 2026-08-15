const KEY = 'shina_crm_bundles'

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}
const save = (list) => localStorage.setItem(KEY, JSON.stringify(list))

export const getBundles = async () => load()

export const createBundle = async (entry) => {
  const list = load()
  const bundle = {
    id: Date.now(),
    name: entry.name,
    shopId: entry.shopId || 'all',
    discount: Number(entry.discount) || 0,
    products: entry.products || [],
    isActive: true,
    createdAt: new Date().toISOString(),
  }
  save([...list, bundle])
  return bundle
}

export const updateBundle = async (id, entry) => {
  const list = load()
  const updated = list.map(b => b.id === id ? { ...b, ...entry, id } : b)
  save(updated)
  return updated.find(b => b.id === id)
}

export const deleteBundle = async (id) => {
  save(load().filter(b => b.id !== id))
}

export const toggleBundle = async (id) => {
  const list = load()
  const updated = list.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b)
  save(updated)
  return updated.find(b => b.id === id)
}
