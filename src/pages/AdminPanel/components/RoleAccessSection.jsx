import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, X, ChevronRight, ChevronDown, Shield } from 'lucide-react'
import PermissionTree from '../../../components/PermissionTree'
import { PERMISSION_TREE } from '../../../config/permissionTree'
import { useSettingsStore } from '../../../store/settingsStore'
import { useAuditStore } from '../../../store/auditStore'
import { useAuthStore } from '../../../store/authStore'
import { ROLE_LABELS_KEYS } from '../apHelpers.jsx'

function RoleAccessSection() {
  const { t } = useTranslation()
  const {
    roleAccessTrees, roleDeniedNodes, setRoleAccessTree, setRoleDeniedNodes,
    customRoles, addCustomRole, removeCustomRole,
  } = useSettingsStore()
  const { addLog } = useAuditStore()
  const { user: me } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState('manager')
  const [newRoleName, setNewRoleName] = useState('')
  const [roleError, setRoleError] = useState('')
  const ROLE_LABELS = Object.fromEntries(Object.entries(ROLE_LABELS_KEYS).map(([k, v]) => [k, t(v)]))
  const roleLabels = { ...ROLE_LABELS, ...Object.fromEntries((customRoles||[]).map(r => [r.id, r.label])) }
  const TREE_ROLES = Object.entries(roleLabels).filter(([k]) => k !== 'admin')
  const slugify = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  const createRole = () => {
    const label = newRoleName.trim()
    const id = slugify(label)
    if (!id) { setRoleError(t('adm_role_name_empty')); return }
    if (ROLE_LABELS[id] || (customRoles||[]).some(r => r.id === id)) { setRoleError(t('adm_role_already_exists')); return }
    addCustomRole({ id, label })
    setNewRoleName(''); setRoleError(''); setSelectedRole(id)
    addLog({ userId: me?.id, userName: me?.fullName || me?.username, action: "Yangi lavozim qo'shildi", actionKey: 'audit_role_added', entity: 'settings', details: label })
  }
  const deleteRole = (r) => {
    removeCustomRole(r.id)
    if (selectedRole === r.id) setSelectedRole('manager')
    addLog({ userId: me?.id, userName: me?.fullName || me?.username, action: "Lavozim o'chirildi", actionKey: 'audit_role_deleted', entity: 'settings', details: r.label })
  }
  return (
    <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-2 px-5 py-4 text-left hover:bg-bg-tertiary transition-colors">
        {open ? <ChevronDown size={16} className="text-text-muted"/> : <ChevronRight size={16} className="text-text-muted"/>}
        <Shield size={15} className="text-accent-orange"/>
        <h3 className="font-syne font-bold text-text-primary text-sm">{t('adm_role_permissions')}</h3>
        <span className="ml-auto text-xs text-text-muted">{TREE_ROLES.length} {t('adm_role_count')}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
          <div className="flex gap-2 flex-wrap">
            {TREE_ROLES.map(([key, label]) => {
              const isCustom = (customRoles||[]).some(r => r.id === key)
              return (
                <div key={key} className="flex items-center gap-0.5">
                  <button onClick={() => setSelectedRole(key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selectedRole === key ? 'bg-accent-red text-white border-accent-red' : 'bg-bg-tertiary border-border text-text-secondary hover:border-accent-red/50'}`}>
                    {label}
                  </button>
                  {isCustom && (
                    <button onClick={() => deleteRole({ id: key, label })} className="p-1 text-text-muted hover:text-accent-red transition-colors">
                      <X size={12}/>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex gap-2 items-center">
            <input value={newRoleName} onChange={e => { setNewRoleName(e.target.value); setRoleError('') }}
              placeholder={t('adm_new_role_placeholder')}
              className="flex-1 bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-red min-w-0"/>
            <button onClick={createRole} className="flex items-center gap-1.5 px-3 py-2 bg-accent-red text-white rounded-xl text-xs font-bold hover:opacity-90 whitespace-nowrap">
              <Plus size={13}/> {t('add')}
            </button>
          </div>
          {roleError && <p className="text-xs text-accent-red">{roleError}</p>}
          {selectedRole !== 'manager' && (
            <p className="text-xs text-text-muted">{t('adm_role_ceiling_note')}</p>
          )}
          <div className="bg-bg-tertiary border border-border rounded-xl p-4">
            <PermissionTree
              tree={PERMISSION_TREE}
              checked={roleAccessTrees[selectedRole] || []}
              onChange={(ids) => setRoleAccessTree(selectedRole, ids)}
              denied={roleDeniedNodes[selectedRole] || []}
              onDeniedChange={(ids) => setRoleDeniedNodes(selectedRole, ids)}
              ceiling={selectedRole === 'manager' ? null : (roleAccessTrees.manager || [])}
            />
          </div>
        </div>
      )}
    </div>
  )
}


export default RoleAccessSection
