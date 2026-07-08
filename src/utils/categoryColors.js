// src/utils/categoryColors.js
export const CATEGORY_COLOR_PALETTE = [
  { bg: 'bg-accent-blue/10',   text: 'text-accent-blue',   border: 'border-accent-blue/30',   hex: '#3B82F6' },
  { bg: 'bg-accent-orange/10', text: 'text-accent-orange', border: 'border-accent-orange/30', hex: '#F59E0B' },
  { bg: 'bg-accent-purple/10', text: 'text-accent-purple', border: 'border-accent-purple/30', hex: '#8B5CF6' },
  { bg: 'bg-accent-green/10',  text: 'text-accent-green',  border: 'border-accent-green/30',  hex: '#22C55E' },
  { bg: 'bg-accent-red/10',    text: 'text-accent-red',    border: 'border-accent-red/30',    hex: '#E63946' },
  { bg: 'bg-accent-teal/10',   text: 'text-accent-teal',   border: 'border-accent-teal/30',   hex: '#14B8A6' },
  { bg: 'bg-accent-pink/10',   text: 'text-accent-pink',   border: 'border-accent-pink/30',   hex: '#EC4899' },
  { bg: 'bg-accent-yellow/10', text: 'text-accent-yellow', border: 'border-accent-yellow/30', hex: '#EAB308' },
  { bg: 'bg-accent-indigo/10', text: 'text-accent-indigo', border: 'border-accent-indigo/30', hex: '#6366F1' },
  { bg: 'bg-accent-cyan/10',   text: 'text-accent-cyan',   border: 'border-accent-cyan/30',   hex: '#06B6D4' },
]

export const getCategoryColor = (categoryId, productCategories) => {
  if (!productCategories) return CATEGORY_COLOR_PALETTE[0]
  const idx = productCategories.findIndex(c => c.id === categoryId)
  return CATEGORY_COLOR_PALETTE[idx >= 0 ? idx % CATEGORY_COLOR_PALETTE.length : 0] || CATEGORY_COLOR_PALETTE[0]
}
