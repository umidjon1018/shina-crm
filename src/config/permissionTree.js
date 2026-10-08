// Sahifa → tab → ustun ruxsatlar daraxti
// id ierarxik nuqta bilan: 'reports.profit.cost'
export const PERMISSION_TREE = [
  { id: 'dashboard', label: 'Bosh sahifa' },
  {
    id: 'warehouse', label: 'Ombor', children: [
      {
        id: 'warehouse.stock', label: 'Qoldiq', children: [
          { id: 'warehouse.stock.income_price', label: 'Kirim narxi ustuni', denyable: true },
        ]
      },
      { id: 'warehouse.used_stock', label: "B/U Qoldiq" },
      {
        id: 'warehouse.income', label: 'Kirim', children: [
          { id: 'warehouse.income.financial', label: "Moliyaviy ma'lumotlar", denyable: true },
        ]
      },
      { id: 'warehouse.products', label: 'Tovarlar (katalog, narx, kategoriya)' },
      { id: 'warehouse.barcode', label: 'Barkod' },
      { id: 'warehouse.stocktake', label: 'Inventarizatsiya' },
      { id: 'warehouse.writeoff', label: 'Hisobdan chiqarish' },
    ]
  },
  {
    id: 'sales', label: 'Sotuv', children: [
      { id: 'sales.new_sale', label: 'Yangi sotuv' },
      { id: 'sales.used_sale', label: "B/U Sotuv" },
      { id: 'sales.reservations', label: 'Bronlar' },
      { id: 'sales.returns', label: 'Bekor qilish' },
      { id: 'sales.history', label: 'Sotuv tarixi' },
      { id: 'sales.returns_history', label: 'Bekor tarixi' },
      {
        id: 'sales.installment', label: "Muddatli to'lov", children: [
          { id: 'sales.installment.percent_columns', label: '% va Foiz ustunlari', denyable: true },
          { id: 'sales.installment.org_commission', label: 'Tashkilotlar komissiya ustunlari', denyable: true },
        ]
      },
      { id: 'sales.profit', label: 'Foyda', denyable: true },
      { id: 'sales.cash_expense', label: 'Kassadan xarajat' },
      { id: 'sales.gift_cards', label: "Sovg'a sertifikati sotish" },
    ]
  },
  {
    id: 'wholesale', label: 'Ulgurji savdo', children: [
      { id: 'wholesale.docs', label: 'Hujjatlar (sotuv, konsignatsiya, qaytarish)' },
      { id: 'wholesale.clients', label: 'Ulgurji mijozlar (dilerlar)' },
      { id: 'wholesale.debts', label: "Qarzlar va to'lovlar" },
      { id: 'wholesale.prices', label: 'Ulgurji narxlar va narx guruhlari' },
    ]
  },
  {
    id: 'production', label: 'Ishlab chiqarish', children: [
      { id: 'production.orders', label: 'Buyurtmalar (ishlab chiqarish, yakunlash)' },
      { id: 'production.materials', label: 'Xomashyo kirimi va inventarizatsiya' },
      { id: 'production.recipes', label: 'Retseptlar va mahsulotlar' },
    ]
  },
  {
    id: 'income', label: 'Kirim', children: [
      { id: 'income.batches', label: 'Kirimlar' },
      { id: 'income.suppliers', label: 'Yetkazib beruvchilar' },
      { id: 'income.debts', label: 'Qarzlar' },
      { id: 'income.orders', label: 'Buyurtmalar' },
      { id: 'income.settlements', label: 'Hisob-kitob' },
      { id: 'income.payments', label: "To'lovlar tarixi" },
      { id: 'income.returns', label: 'Qaytarish' },
    ]
  },
  {
    id: 'expenses', label: 'Moliya', children: [
      { id: 'expenses.shop', label: "Do'kon xarajatlari" },
      { id: 'expenses.income', label: 'Daromadlar' },
      { id: 'expenses.cashflow', label: 'Pul harakati' },
      { id: 'expenses.pnl', label: 'Foyda va zarar' },
      { id: 'expenses.debts', label: 'Qarzlar' },
      { id: 'expenses.supplier', label: 'Yetkazib beruvchi to\'lovlari' },
      { id: 'expenses.capital', label: 'Kapital harakati' },
      { id: 'expenses.categories', label: 'Kategoriyalar' },
    ]
  },
  {
    id: 'reports', label: 'Hisobotlar', children: [
      { id: 'reports.sales', label: 'Sotuv' },
      { id: 'reports.products', label: 'Tovarlar (savdo, samaradorlik)' },
      { id: 'reports.stock', label: 'Qoldiq' },
      { id: 'reports.movement', label: 'Ombor harakati, sanaga qoldiq' },
      { id: 'reports.supply', label: 'Kirim va yetkazib beruvchilar' },
      { id: 'reports.customers', label: 'Mijozlar' },
      { id: 'reports.employees', label: 'Xodimlar' },
      { id: 'reports.shops', label: "Do'konlar" },
      { id: 'reports.finance', label: 'Moliya' },
      { id: 'reports.used', label: "B/U tovarlar" },
      { id: 'reports.profit', label: 'Foyda' },
    ]
  },
  { id: 'ai_agent', label: 'AI Agent' },
  { id: 'customers', label: 'Mijozlar' },
  {
    id: 'marketing', label: 'Marketing', children: [
      { id: 'marketing.promotions', label: 'Aksiyalar' },
      { id: 'marketing.codes', label: 'Promokodlar va vaucherlar' },
      { id: 'marketing.gift_cards', label: "Sovg'a sertifikatlari" },
      { id: 'marketing.messages', label: 'Telegram xabarlar' },
      { id: 'marketing.birthdays', label: "Tug'ilgan kunlar" },
      { id: 'marketing.loyalty', label: "Sodiqlik (jamg'arma chegirma, keshbek)" },
      { id: 'marketing.settings', label: 'Telegram bot sozlamalari' },
    ]
  },
  { id: 'notifications', label: "Bildirishnomalar (chegirma so'rovlarini tasdiqlash)" },
  {
    id: 'settings', label: 'Sozlamalar', children: [
      { id: 'settings.employees', label: 'Xodimlar' },
      { id: 'settings.devices', label: 'Qurilmalar' },
      { id: 'settings.sales_rules', label: "Savdo qoidalari (kurs, nasiya, chegirma chegarasi, rejalar)" },
      { id: 'settings.notifications', label: 'Bildirishnoma sozlamalari' },
    ]
  },
]

export const flattenIds = (tree) => {
  const ids = []
  for (const node of tree) {
    ids.push(node.id)
    if (node.children) ids.push(...flattenIds(node.children))
  }
  return ids
}
