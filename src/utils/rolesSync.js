import api from '../api/client'
import { useSettingsStore } from '../store/settingsStore'
import { useAuthStore } from '../store/authStore'

// Lavozimlar va ruxsatlar daraxti serverda saqlanadi (barcha qurilmalar uchun bir xil).
// Mahalliy settingsStore — faqat kesh (offlayn ishlash uchun).

let lastSynced = null
const snapshot = () => {
  const s = useSettingsStore.getState()
  return JSON.stringify({ roleAccessTrees: s.roleAccessTrees, roleDeniedNodes: s.roleDeniedNodes, customRoles: s.customRoles })
}

// true — serverga yozildi; false — o'zgarish yo'q
export const pushRolesToServer = async () => {
  const snap = snapshot()
  if (snap === lastSynced) return false
  await api.put('/api/settings/roles', JSON.parse(snap))
  lastSynced = snap
  return true
}

// Server bilan kamida bir marta sinxronlanganmi (eski mahalliy sozlama serverdagini bosib ketmasligi uchun)
export const hasSyncedRoles = () => lastSynced !== null

export const syncRolesFromServer = async () => {
  const { user } = useAuthStore.getState()
  if (!user) return
  const { data } = await api.get('/api/settings/roles')
  if (data?.config) {
    useSettingsStore.setState({
      roleAccessTrees: data.config.roleAccessTrees || {},
      roleDeniedNodes: data.config.roleDeniedNodes || {},
      customRoles: data.config.customRoles || [],
    })
    lastSynced = snapshot()
  } else if (user.role === 'admin') {
    // Serverda hali yo'q — admin qurilmasidagi mavjud sozlama serverga ko'chiriladi
    await pushRolesToServer()
  }
  // Admin xodim lavozimi yoki individual ruxsatini o'zgartirgan bo'lsa — qayta kirmasdan qo'llanadi
  if (data?.me) {
    const cur = useAuthStore.getState().user
    if (cur && (cur.role !== data.me.role || JSON.stringify(cur.access || null) !== JSON.stringify(data.me.access || null))) {
      useAuthStore.setState({ user: { ...cur, role: data.me.role, access: data.me.access || null } })
    }
  }
}

