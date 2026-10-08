import { createPromotion } from '../api/promotionService'

// Eski komplektlar faqat brauzerda (localStorage) edi — endi Marketing → Aksiyalar ("Komplekt" turi), serverda.
// Admin/boshqaruvchi qurilmasida qolgan komplektlar bir marta serverga ko'chiriladi.
const KEY = 'shina_crm_bundles'

export const migrateLocalBundles = async () => {
  let list = []
  try { list = JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return }
  if (!Array.isArray(list) || !list.length) return
  const failed = []
  for (const b of list) {
    const items = (b.products || []).map(p => ({ productId: String(p.productId), qty: Number(p.quantity) || 1 }))
    if (!b.name || items.reduce((a, x) => a + x.qty, 0) < 2 || !(Number(b.discount) > 0)) continue
    try {
      await createPromotion({
        name: b.name, kind: 'bundle', bundleItems: items, discountType: 'percent', discountValue: Number(b.discount),
        shopId: b.shopId || 'all', isActive: b.isActive !== false, conditions: {},
      })
    } catch { failed.push(b) }
  }
  try {
    if (failed.length) localStorage.setItem(KEY, JSON.stringify(failed))
    else localStorage.removeItem(KEY)
  } catch { /* xotira yopiq */ }
}
