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
      { id: 'warehouse.barcode', label: 'Barkod' },
    ]
  },
  {
    id: 'sales', label: 'Sotuv', children: [
      { id: 'sales.new_sale', label: 'Yangi sotuv' },
      { id: 'sales.used_sale', label: "B/U Sotuv" },
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
    id: 'income', label: 'Kirim', children: [
      { id: 'income.batches', label: 'Kirimlar' },
      { id: 'income.suppliers', label: 'Yetkazib beruvchilar' },
      { id: 'income.debts', label: 'Qarzlar' },
    ]
  },
  {
    id: 'expenses', label: 'Moliya', children: [
      { id: 'expenses.shop', label: "Do'kon xarajatlari" },
      { id: 'expenses.income', label: 'Daromadlar' },
      { id: 'expenses.cashflow', label: 'Pul harakati' },
      { id: 'expenses.pnl', label: 'Foyda va zarar' },
      { id: 'expenses.supplier', label: 'Yetkazib beruvchi to\'lovlari' },
      { id: 'expenses.capital', label: 'Kapital harakati' },
      { id: 'expenses.categories', label: 'Kategoriyalar' },
    ]
  },
  {
    id: 'reports', label: 'Hisobotlar', children: [
      { id: 'reports.sales', label: 'Sotuv' },
      { id: 'reports.stock', label: 'Qoldiq' },
      { id: 'reports.customers', label: 'Mijozlar' },
      { id: 'reports.employees', label: 'Xodimlar' },
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
      { id: 'marketing.sms', label: 'SMS xabarlar' },
      { id: 'marketing.birthdays', label: "Tug'ilgan kunlar" },
      { id: 'marketing.settings', label: 'SMS sozlamalari' },
    ]
  },
  {
    id: 'management', label: 'Boshqaruv', children: [
      { id: 'management.notifications', label: 'Ogohlantirishlar' },
      { id: 'management.products', label: 'Tovarlar' },
      { id: 'management.employees', label: 'Xodimlar' },
      { id: 'management.discounts', label: 'Chegirmalar' },
      { id: 'management.shops', label: "Do'konlar" },
      { id: 'management.settings', label: 'Sozlamalar' },
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
