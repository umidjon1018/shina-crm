// Hisobotlar uchun umumiy: diagramma ranglari va Excel eksport
const C = {
  red:    '#E63946',
  green:  '#22C55E',
  blue:   '#3B82F6',
  orange: '#F59E0B',
  purple: '#8B5CF6',
  pink:   '#EC4899',
  muted:  '#6B7280',
  teal:   '#14B8A6',
}

const exportXLSX = async (filename, sheets) => {
  const XLSX = await import('xlsx')
  // sheets: [{ name, rows }]
  const wb = XLSX.utils.book_new()
  sheets.forEach(({ name, rows }) => {
    if (!rows.length) return
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31))
  })
  XLSX.writeFile(wb, filename + '.xlsx')
}

export { C, exportXLSX }
