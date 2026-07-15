// Shared constants and helpers for AIAgent tabs

export const TAB_COLORS = {
  overview:  { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/30',  dot: 'bg-purple-400' },
  sales:     { bg: 'bg-[#22c55e]/10',   text: 'text-[#22c55e]',   border: 'border-[#22c55e]/30',   dot: 'bg-[#22c55e]' },
  inventory: { bg: 'bg-[#E63946]/10',   text: 'text-[#E63946]',   border: 'border-[#E63946]/30',   dot: 'bg-[#E63946]' },
  marketing: { bg: 'bg-[#f97316]/10',   text: 'text-[#f97316]',   border: 'border-[#f97316]/30',   dot: 'bg-[#f97316]' },
  customer:  { bg: 'bg-[#3b82f6]/10',   text: 'text-[#3b82f6]',   border: 'border-[#3b82f6]/30',   dot: 'bg-[#3b82f6]' },
  staff:     { bg: 'bg-[#a855f7]/10',   text: 'text-[#a855f7]',   border: 'border-[#a855f7]/30',   dot: 'bg-[#a855f7]' },
}

export const TYPE_COLORS = {
  ALERT:          'text-[#E63946] bg-[#E63946]/10',
  RECOMMENDATION: 'text-[#22c55e] bg-[#22c55e]/10',
  ANALYSIS:       'text-[#3b82f6] bg-[#3b82f6]/10',
  BOOKING:        'text-purple-400 bg-purple-400/10',
  NOTE:           'text-[#f97316] bg-[#f97316]/10',
}

export const TYPE_LABEL_KEYS = {
  ALERT: 'ai_type_alert', RECOMMENDATION: 'ai_type_recommendation', ANALYSIS: 'ai_type_analysis',
  BOOKING: 'ai_type_booking', NOTE: 'ai_type_note',
}

export const AGENT_LABEL_KEYS = {
  sales: 'ai_tab_sales', inventory: 'ai_tab_inventory', marketing: 'ai_tab_marketing', customer: 'ai_tab_customer', staff: 'ai_tab_staff',
}

export const TAB_AGENT_KEYS = {
  overview: 'ai_agent_overview',
  sales: 'ai_agent_sales',
  inventory: 'ai_agent_inventory',
  marketing: 'ai_agent_marketing',
  customer: 'ai_agent_customer',
  staff: 'ai_agent_staff',
}

export const TAB_DESC_KEYS = {
  overview: 'ai_overview_desc',
  sales: 'ai_sales_desc',
  inventory: 'ai_inventory_desc',
  marketing: 'ai_marketing_desc',
  customer: 'ai_customer_desc',
  staff: 'ai_staff_desc',
}

export function fmtNum(n, t) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  if (abs >= 1_000_000) return sign + (abs / 1_000_000).toFixed(1) + ' ' + (t ? t('ai_num_mln') : 'mln')
  if (abs >= 1_000) return sign + (abs / 1_000).toFixed(0) + ' ' + (t ? t('ai_num_thousand') : 'ming')
  return String(n)
}

export function fmtTime(iso, t) {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now - d) / 60000)
  if (!t) {
    if (diff < 1) return 'hozirgina'
    if (diff < 60) return diff + ' daqiqa oldin'
    if (diff < 1440) return Math.floor(diff / 60) + ' soat oldin'
    return Math.floor(diff / 1440) + ' kun oldin'
  }
  if (diff < 1) return t('ai_time_just_now')
  if (diff < 60) return diff + ' ' + t('ai_time_min_ago')
  if (diff < 1440) return Math.floor(diff / 60) + ' ' + t('ai_time_hour_ago')
  return Math.floor(diff / 1440) + ' ' + t('ai_time_day_ago')
}
