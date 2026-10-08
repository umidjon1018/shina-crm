import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Rows3, Columns3 } from 'lucide-react'

const norm = (s) => String(s || '').replace(/[⇅▲▼↑↓↕]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()

// Ixcham | To'liq almashtirgich (alohida ham ishlatiladi)
export const ViewToggle = ({ full, onChange }) => {
  const { t } = useTranslation()
  const btn = (on) => `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors
    ${on ? 'g-brand text-white shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'}`
  return (
    <div className="inline-flex items-center gap-0.5 panel !rounded-xl p-0.5 shrink-0">
      <button type="button" onClick={() => onChange(false)} className={btn(!full)}><Rows3 size={15} /> {t('tbl_compact')}</button>
      <button type="button" onClick={() => onChange(true)} className={btn(full)}><Columns3 size={15} /> {t('tbl_full')}</button>
    </div>
  )
}

// Ixcham/To'liq tanlovi (brauzerda eslab qolinadi)
export const useTableView = (id) => {
  const key = 'tv_' + id
  const [full, setFull] = useState(() => { try { return localStorage.getItem(key) === 'full' } catch { return false } })
  const set = (v) => { setFull(v); try { localStorage.setItem(key, v ? 'full' : 'compact') } catch { /* saqlanmasa ham ishlaydi */ } }
  return [full, set]
}

// Jadval o'rovchisi: ixcham rejimda `optional` sarlavhali ustunlar yashiriladi (sarlavha matni bo'yicha,
// boshi mos kelsa ham bo'ladi). Ichidagi jadval kodi o'zgarmaydi; qatorlar qayta chizilsa ham kuzatib turadi.
const TableView = ({ id, optional = [], children, className = '', toolbar = null }) => {
  const [full, setFull] = useTableView(id)
  const ref = useRef(null)
  const optKey = optional.map(o => (typeof o === 'number' ? '#' + o : norm(o))).join('|')

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const opts = optKey ? optKey.split('|') : []
    const apply = () => {
      root.querySelectorAll('[data-tv-hide]').forEach(el => el.removeAttribute('data-tv-hide'))
      if (full || !opts.length) return
      root.querySelectorAll('table').forEach(table => {
        const head = table.tHead?.rows?.[table.tHead.rows.length - 1] || table.rows?.[0]
        if (!head) return
        const hide = new Set()
        let pos = 0
        for (const cell of head.cells) {
          const txt = norm(cell.textContent)
          const span = cell.colSpan || 1
          if (opts.some(o => (o.startsWith('#') ? Number(o.slice(1)) === pos : txt && (txt === o || txt.startsWith(o))))) {
            for (let k = 0; k < span; k++) hide.add(pos + k)
          }
          pos += span
        }
        if (!hide.size) return
        table.querySelectorAll(':scope > colgroup > col').forEach((c, i) => { if (hide.has(i)) c.setAttribute('data-tv-hide', '') })
        for (const row of table.rows) {
          let p = 0
          for (const cell of row.cells) {
            const span = cell.colSpan || 1
            if (span === 1 && hide.has(p)) cell.setAttribute('data-tv-hide', '')
            p += span
          }
        }
      })
    }
    apply()
    const mo = new MutationObserver(apply)
    mo.observe(root, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [full, optKey])

  return (
    <div className={className}>
      {(optional.length > 0 || toolbar) && (
        <div className="flex flex-wrap items-center justify-end gap-2 mb-2">
          {toolbar}
          {optional.length > 0 && <ViewToggle full={full} onChange={setFull} />}
        </div>
      )}
      <div ref={ref} className={full ? '' : 'tv-compact'}>{children}</div>
    </div>
  )
}

export default TableView
