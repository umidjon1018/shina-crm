import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { flattenIds } from '../config/permissionTree'
import { useSettingsStore } from '../store/settingsStore'

const SIDEBAR_KEY_MAP = { ai_agent: 'aiAgent' }

const isChecked = (node, checked) => {
  if (checked.includes(node.id)) return true
  if (!node.children) return false
  return node.children.every(c => isChecked(c, checked))
}
const isIndeterminate = (node, checked) => {
  if (checked.includes(node.id) || !node.children) return false
  return node.children.some(c => isChecked(c, checked) || isIndeterminate(c, checked))
}
function TreeNode({ node, checked, onChange, denied, onDeniedChange, ceiling, depth, ancestorChecked, ancestorAllowed, t, sidebarLabels }) {
  const [open, setOpen] = useState(true)
  const selfChecked = isChecked(node, checked)
  const checkedState = ancestorChecked || selfChecked
  const indeterminate = !checkedState && isIndeterminate(node, checked)
  const allowed = ancestorAllowed || !ceiling || ceiling.includes(node.id)
  const disabled = !allowed || (node.denyable ? !ancestorChecked : ancestorChecked)

  const toggle = () => {
    if (disabled) return
    if (node.denyable) {
      const isDenied = denied.includes(node.id)
      onDeniedChange(
        isDenied ? denied.filter(id => id !== node.id) : [...denied, node.id]
      )
      return
    }
    const ids = flattenIds([node])
    if (checkedState) {
      onChange(checked.filter(id => !ids.includes(id) && id !== node.id))
    } else {
      const next = new Set(checked)
      ids.forEach(id => next.add(id))
      next.add(node.id)
      onChange([...next])
    }
  }

  const denyableChecked = node.denyable ? (checkedState && !denied.includes(node.id)) : checkedState

  return (
    <div>
      <div className="flex items-center gap-2 py-1.5" style={{ paddingLeft: depth * 20 }}>
        {node.children ? (
          <button type="button" onClick={() => setOpen(o => !o)} className="text-text-muted hover:text-text-primary">
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-3.5 inline-block" />
        )}
        <label className={`flex items-center gap-2 text-sm ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={denyableChecked}
            ref={el => { if (el) el.indeterminate = !node.denyable && indeterminate }}
            disabled={disabled}
            onChange={toggle}
            className="accent-accent-red"
          />
          <span className={`font-semibold ${depth === 0 ? 'text-text-primary' : 'text-text-secondary'}`}>
            {depth === 0 && sidebarLabels?.[SIDEBAR_KEY_MAP[node.id] || node.id]
              ? sidebarLabels[SIDEBAR_KEY_MAP[node.id] || node.id]
              : t('perm_' + node.id.replace(/\./g, '_'))}
          </span>
        </label>
      </div>
      {node.children && open && (
        <div>
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} checked={checked} onChange={onChange} denied={denied} onDeniedChange={onDeniedChange} ceiling={ceiling} depth={depth + 1} ancestorChecked={checkedState} ancestorAllowed={allowed} t={t} sidebarLabels={sidebarLabels} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function PermissionTree({ tree, checked, onChange, denied = [], onDeniedChange = () => {}, ceiling }) {
  const { t, i18n } = useTranslation()
  const { sidebarLabels } = useSettingsStore()
  const resolvedLabels = Object.fromEntries(
    Object.entries(sidebarLabels || {}).map(([k, v]) => [
      k,
      v && typeof v === 'object' ? (v[i18n.language] || '') : (i18n.language === 'uz' ? (v || '') : '')
    ])
  )
  return (
    <div>
      {tree.map(node => (
        <TreeNode key={node.id} node={node} checked={checked} onChange={onChange} denied={denied} onDeniedChange={onDeniedChange} ceiling={ceiling} depth={0} t={t} sidebarLabels={resolvedLabels} />
      ))}
    </div>
  )
}
