// Aksiya shablonlari: oddiy (bitta qadamda) va kengaytirilgan (shartli/murakkab)
const base = {
  kind: 'discount', targetType: 'all', targetIds: [], discountType: 'percent', discountValue: 10, minQty: 1,
  buyQty: 2, getQty: 1, getDiscount: 100, giftTargetType: null, giftTargetIds: [],
  tiers: [{ qty: 1, percent: 10 }, { qty: 2, percent: 15 }, { qty: 3, percent: 20 }],
  minTotal: 0, bundleItems: [], stackable: false, requiresCode: false, startDate: '', endDate: '', shopId: 'all',
  conditions: { weekdays: [], timeFrom: '', timeTo: '', customer: 'any', groups: [], birthdayDays: 3, excludeInstallment: false },
}

export const SIMPLE_TEMPLATES = [
  { id: 'product_percent', icon: 'Percent', patch: { kind: 'discount', targetType: 'product', discountType: 'percent', discountValue: 10 } },
  { id: 'product_amount', icon: 'BadgeMinus', patch: { kind: 'discount', targetType: 'product', discountType: 'amount', discountValue: 50000 } },
  { id: 'product_price', icon: 'Tag', patch: { kind: 'discount', targetType: 'product', discountType: 'fixed_price', discountValue: 0 } },
  { id: 'category_percent', icon: 'Layers', patch: { kind: 'discount', targetType: 'category', discountType: 'percent', discountValue: 10 } },
  { id: 'all_percent', icon: 'Store', patch: { kind: 'discount', targetType: 'all', discountType: 'percent', discountValue: 5 } },
  { id: 'receipt_amount', icon: 'Receipt', patch: { kind: 'receipt', discountType: 'amount', discountValue: 50000, minTotal: 1000000 } },
]

export const ADVANCED_TEMPLATES = [
  { id: 'bundle', icon: 'Package', patch: { kind: 'bundle', discountType: 'percent', discountValue: 10, bundleItems: [] } },
  { id: 'gift_2_1', icon: 'Gift', patch: { kind: 'gift', targetType: 'category', buyQty: 2, getQty: 1, getDiscount: 100 } },
  { id: 'gift_3_1', icon: 'Gift', patch: { kind: 'gift', targetType: 'category', buyQty: 3, getQty: 1, getDiscount: 100 } },
  { id: 'second_half', icon: 'Copy', patch: { kind: 'gift', targetType: 'product', buyQty: 1, getQty: 1, getDiscount: 50 } },
  { id: 'gift_other', icon: 'PackagePlus', patch: { kind: 'gift', targetType: 'category', buyQty: 4, getQty: 1, getDiscount: 100, giftTargetType: 'category' } },
  { id: 'carousel', icon: 'Repeat', patch: { kind: 'carousel', targetType: 'category', tiers: [{ qty: 1, percent: 20 }, { qty: 2, percent: 30 }, { qty: 3, percent: 40 }] } },
  { id: 'receipt_percent', icon: 'Receipt', patch: { kind: 'receipt', discountType: 'percent', discountValue: 5, minTotal: 3000000 } },
  { id: 'birthday', icon: 'Cake', patch: { kind: 'receipt', discountType: 'percent', discountValue: 10, conditions: { customer: 'birthday', birthdayDays: 3 } } },
  { id: 'happy_hours', icon: 'Clock', patch: { kind: 'discount', targetType: 'all', discountType: 'percent', discountValue: 5, conditions: { timeFrom: '09:00', timeTo: '12:00' } } },
  { id: 'weekend', icon: 'CalendarDays', patch: { kind: 'discount', targetType: 'all', discountType: 'percent', discountValue: 5, conditions: { weekdays: [0, 6] } } },
  { id: 'new_customer', icon: 'UserPlus', patch: { kind: 'receipt', discountType: 'percent', discountValue: 5, conditions: { customer: 'new' } } },
  { id: 'group', icon: 'Users', patch: { kind: 'receipt', discountType: 'percent', discountValue: 7, conditions: { customer: 'group' } } },
  { id: 'code_only', icon: 'Ticket', patch: { kind: 'receipt', discountType: 'percent', discountValue: 10, requiresCode: true } },
]

export const fromTemplate = (tpl, name) => ({
  ...base,
  ...tpl.patch,
  conditions: { ...base.conditions, ...(tpl.patch.conditions || {}) },
  template: tpl.id,
  name: name || '',
})

export const emptyPromo = () => ({ ...base, conditions: { ...base.conditions }, name: '' })
