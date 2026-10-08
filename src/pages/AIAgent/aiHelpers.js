// AI Agent sahifasi uchun umumiy konstantalar

export const TAB_COLORS = {
  overview:  { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/30' },
  sales:     { bg: 'bg-[#22c55e]/10',   text: 'text-[#22c55e]',   border: 'border-[#22c55e]/30' },
  inventory: { bg: 'bg-[#E63946]/10',   text: 'text-[#E63946]',   border: 'border-[#E63946]/30' },
  customers: { bg: 'bg-[#3b82f6]/10',   text: 'text-[#3b82f6]',   border: 'border-[#3b82f6]/30' },
  marketing: { bg: 'bg-[#f97316]/10',   text: 'text-[#f97316]',   border: 'border-[#f97316]/30' },
  staff:     { bg: 'bg-[#a855f7]/10',   text: 'text-[#a855f7]',   border: 'border-[#a855f7]/30' },
  instagram: { bg: 'bg-pink-500/10',    text: 'text-pink-400',    border: 'border-pink-500/30' },
}

export const TAB_AGENT_KEYS = {
  overview: 'aisec_head_overview', sales: 'aisec_head_sales', inventory: 'aisec_head_inventory',
  customers: 'aisec_head_customers', marketing: 'aisec_head_marketing', staff: 'aisec_head_staff', instagram: 'ai_agent_instagram',
}

export const TAB_DESC_KEYS = {
  overview: 'aisec_desc_overview', sales: 'aisec_desc_sales', inventory: 'aisec_desc_inventory',
  customers: 'aisec_desc_customers', marketing: 'aisec_desc_marketing', staff: 'aisec_desc_staff', instagram: 'ai_instagram_desc',
}

// Mahalliy (Toshkent) sana — toISOString() UTC beradi va kun chegarasida 5 soat siljiydi
const pad2 = (n) => String(n).padStart(2, '0')
export const localYmd = (d) => {
  const x = d instanceof Date ? d : new Date(d)
  return isNaN(x) ? '' : `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`
}
