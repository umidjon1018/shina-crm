import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence } from 'framer-motion'
import { AlertTriangle, Ban, CheckSquare, RotateCcw, ScanFace, Shield, ShieldAlert, ShieldCheck, Smartphone, Trash2, User, X, XSquare } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { useAuditStore } from '../../../store/auditStore'
import { useFaceStore } from '../../../store/faceStore'
import api from '../../../api/client'
import { MONTHS_UZ, MONTHS_RU, formatDateTimeWithMonths, Badge, ModalWrap } from '../apHelpers.jsx'

function DevicesTab() {
  const { t, i18n } = useTranslation()
  const MONTHS = i18n.language === 'ru' ? MONTHS_RU : MONTHS_UZ
  const formatDateTime = (d) => formatDateTimeWithMonths(d, MONTHS)
  const { approveDevice, rejectDevice, revokeDevice } = useAuthStore()
  const { addLog } = useAuditStore()
  const { user: me } = useAuthStore()
  const { employees } = useSettingsStore()
  const { descriptors, removeDescriptor } = useFaceStore()
  const [attempts, setAttempts] = useState([])
  const [trusted, setTrusted] = useState([])
  const [selfieModal, setSelfieModal] = useState(null)
  const [showClearAttempts, setShowClearAttempts] = useState(false)
  const PAGE_SIZE = 5
  const [attPage, setAttPage] = useState(1)
  const [trustedPage, setTrustedPage] = useState(1)
  const [facePage, setFacePage] = useState(1)

  const load = async () => {
    try {
      const res = await api.get('/api/auth/attempts')
      setAttempts(res.data.map(a => ({
        id: a.id,
        userId: a.user_id,
        username: a.username,
        fullName: a.full_name,
        role: a.role,
        deviceId: a.device_id,
        selfie: a.selfie,
        isTrusted: a.is_trusted,
        faceMatch: a.face_match,
        status: a.status,
        timestamp: a.created_at,
        allowMultiDevice: a.allow_multi_device || false,
      })))
    } catch { setAttempts([]) }
    try {
      const raw = JSON.parse(localStorage.getItem('shina_trusted_devices') || '[]')
      setTrusted(raw.map(d => typeof d === 'string' ? { deviceId: d, userId: null } : d))
    } catch { setTrusted([]) }
  }
  useEffect(() => { load() }, [])

  const clearAttempts = async () => {
    try { await api.delete('/api/auth/attempts') } catch {}
    addLog({ userId: me?.id, userName: me?.fullName || me?.username, action: 'Kirish tarixi tozalandi', actionKey: 'audit_login_history_cleared', entity: 'device', details: `${attempts.length} ta yozuv` })
    setAttempts([])
    setShowClearAttempts(false)
  }

  const resetFaceId = (userId) => {
    removeDescriptor(userId)
    const name = faceIdOwner(userId)
    addLog({ userId: me?.id, userName: me?.fullName || me?.username, action: 'Yuz ID o\'chirildi', actionKey: 'audit_face_id_deleted', entity: 'device', details: name })
  }

  const faceIdOwner = (userId) => {
    const fromAttempts = attempts.find(a => a.userId === userId || a.username === userId)
    if (fromAttempts) return fromAttempts.fullName || fromAttempts.username
    const fromEmployees = employees.find(e => e.id === userId)
    if (fromEmployees) return fromEmployees.name
    return userId
  }

  const parseUserAgent = (ua) => {
    if (!ua) return null
    let browser = 'Browser'
    let os = ''
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
    else if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
    else if (ua.includes('Edg')) browser = 'Edge'
    if (ua.includes('Windows')) os = 'Windows'
    else if (ua.includes('Mac')) os = 'macOS'
    else if (ua.includes('Android')) os = 'Android'
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
    else if (ua.includes('Linux')) os = 'Linux'
    return os ? `${browser} / ${os}` : browser
  }

  const approve = (a) => {
    approveDevice(a.deviceId)
    addLog({ userId: me?.id, userName: me?.fullName || me?.username, action: 'Qurilma tasdiqlandi', actionKey: 'audit_device_approved', entity: 'device', details: `${a.username} — ${a.deviceId}` })
    load()
  }

  const toggleMultiDevice = async (a) => {
    const newVal = !a.allowMultiDevice
    try {
      await api.patch(`/api/auth/users/${a.userId}/multi-device`, { allow: newVal })
      addLog({ userId: me?.id, userName: me?.fullName || me?.username, action: newVal ? 'Ko\'p qurilmaga ruxsat berildi' : 'Ko\'p qurilma ruxsati olib tashlandi', entity: 'device', details: a.username })
      load()
    } catch {}
  }
  const reject = (a) => {
    rejectDevice(a.deviceId)
    addLog({ userId: me?.id, userName: me?.fullName || me?.username, action: 'Qurilma rad etildi', actionKey: 'audit_device_rejected', entity: 'device', details: `${a.username} — ${a.deviceId}` })
    load()
  }
  const revoke = async (a) => {
    await revokeDevice(a.deviceId)
    addLog({ userId: me?.id, userName: me?.fullName || me?.username, action: 'Qurilma bloklandi', entity: 'device', details: `${a.username} — ${a.deviceId}` })
    load()
  }
  const removeTrusted = (deviceId) => {
    const updated = trusted.filter(d => (d.deviceId || d) !== deviceId)
    localStorage.setItem('shina_trusted_devices', JSON.stringify(updated))
    addLog({ userId: me?.id, userName: me?.fullName || me?.username, action: 'Ishonchli qurilma o\'chirildi', actionKey: 'audit_trusted_device_deleted', entity: 'device', details: deviceId })
    setTrusted(updated)
  }

  const needsAttention = attempts.filter(a => !a.isTrusted && a.status === 'pending').length

  const faceKeys = Object.keys(descriptors)
  const attPages  = Math.max(1, Math.ceil(attempts.length / PAGE_SIZE))
  const trPages   = Math.max(1, Math.ceil(trusted.length / PAGE_SIZE))
  const facePages = Math.max(1, Math.ceil(faceKeys.length / PAGE_SIZE))
  const attSlice  = attempts.slice((attPage - 1) * PAGE_SIZE, attPage * PAGE_SIZE)
  const trSlice   = trusted.slice((trustedPage - 1) * PAGE_SIZE, trustedPage * PAGE_SIZE)
  const faceSlice = faceKeys.slice((facePage - 1) * PAGE_SIZE, facePage * PAGE_SIZE)

  const Pager = ({ page, total, setPage, itemCount }) => total <= 1 ? null : (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border">
      <span className="text-xs text-text-muted">{itemCount != null ? `${Math.min(page * PAGE_SIZE, itemCount)} / ${itemCount} ta` : ''}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="px-3 py-1 rounded-lg text-xs font-medium border border-border text-text-secondary hover:bg-bg-tertiary disabled:opacity-40 transition-colors">
          ←
        </button>
        <span className="text-xs text-text-muted">{page} / {total}</span>
        <button onClick={() => setPage(p => Math.min(total, p + 1))} disabled={page === total}
          className="px-3 py-1 rounded-lg text-xs font-medium border border-border text-text-secondary hover:bg-bg-tertiary disabled:opacity-40 transition-colors">
          →
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {needsAttention > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-accent-orange/10 border border-accent-orange/30 rounded-xl text-accent-orange text-sm font-semibold">
          <ShieldAlert size={18} /> {needsAttention} {t('adm_dev_pending_alert')}
        </div>
      )}

      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <ShieldAlert size={18} className="text-accent-orange" />
          <h3 className="font-syne font-bold text-text-primary">{t('adm_dev_login_history')}</h3>
          <span className="ml-auto text-xs text-text-muted">{attempts.length} {t('adm_dev_records')}</span>
          {attempts.length > 0 && (
            <button onClick={() => setShowClearAttempts(true)} className="px-3 py-1 bg-accent-red/10 text-accent-red text-xs font-bold rounded-lg hover:bg-accent-red/20 border border-accent-red/20">
              {t('adm_dev_clear')}
            </button>
          )}
        </div>
        {attempts.length === 0 ? (
          <div className="text-center py-10 text-text-muted text-sm">{t('adm_dev_no_attempts')}</div>
        ) : (
          <div className="divide-y divide-border">
            {attSlice.map(a => {
              const isPending = !a.isTrusted && a.status !== 'approved' && a.status !== 'rejected'
              const deviceInfo = parseUserAgent(a.userAgent)
              return (
                <div key={a.id} className="px-5 py-4 flex items-center gap-4">
                  {a.selfie ? (
                    <button onClick={() => setSelfieModal(a)} className="w-10 h-10 rounded-xl overflow-hidden border border-border flex-shrink-0 hover:opacity-80 transition-opacity">
                      <img src={a.selfie} alt="selfie" className="w-full h-full object-cover" />
                    </button>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-bg-tertiary border border-border flex items-center justify-center text-text-muted flex-shrink-0">
                      <User size={16} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary text-sm">{a.fullName || a.username || t('adm_emp_unknown')}</p>
                    <p className="text-xs text-text-muted">{formatDateTime(a.timestamp)}{deviceInfo ? ` · ${deviceInfo}` : ''}</p>
                    <p className="text-xs text-text-muted font-mono truncate opacity-50">{a.deviceId}</p>
                    {a.faceMatch === false && <Badge color="bg-accent-red/10 text-accent-red">{t('adm_dev_face_mismatch')}</Badge>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {me?.role === 'admin' && a.role === 'manager' && !isPending && (
                      <button
                        onClick={() => toggleMultiDevice(a)}
                        title={a.allowMultiDevice ? 'Ko\'p qurilma ruxsatini olib tashlash' : 'Ko\'p qurilmaga ruxsat berish'}
                        className={`flex items-center gap-1 px-2 py-1.5 text-xs font-bold rounded-xl border transition-colors ${a.allowMultiDevice ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/20' : 'bg-bg-tertiary text-text-muted border-border hover:border-accent-blue'}`}
                      >
                        <Smartphone size={12} /> {a.allowMultiDevice ? '2+' : '1'}
                      </button>
                    )}
                    {isPending ? (
                      <>
                        <button onClick={() => approve(a)} className="flex items-center gap-1 px-3 py-1.5 bg-accent-green/10 text-accent-green text-xs font-bold rounded-xl hover:bg-accent-green/20 border border-accent-green/30">
                          <CheckSquare size={12} /> {t('confirm')}
                        </button>
                        <button onClick={() => reject(a)} className="flex items-center gap-1 px-3 py-1.5 bg-accent-red/10 text-accent-red text-xs font-bold rounded-xl hover:bg-accent-red/20 border border-accent-red/30">
                          <XSquare size={12} /> {t('adm_dev_reject')}
                        </button>
                      </>
                    ) : (
                      <>
                        <Badge color={a.status === 'approved' ? 'bg-accent-green/10 text-accent-green' : a.status === 'rejected' ? 'bg-accent-red/10 text-accent-red' : a.status === 'revoked' ? 'bg-accent-red/10 text-accent-red' : 'bg-accent-orange/10 text-accent-orange'}>
                          {a.status === 'approved' ? t('adm_dev_approved') : a.status === 'rejected' ? t('adm_dev_rejected') : a.status === 'revoked' ? t('adm_dev_revoked') : t('adm_dev_pending_status')}
                        </Badge>
                        {a.status === 'approved' && (
                          <button onClick={() => revoke(a)} title="Qurilmani bloklash" className="flex items-center gap-1 px-2 py-1.5 bg-accent-red/10 text-accent-red text-xs font-bold rounded-xl hover:bg-accent-red/20 border border-accent-red/30">
                            <Ban size={12} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
            <Pager page={attPage} total={attPages} setPage={setAttPage} itemCount={attempts.length} />
          </div>
        )}
      </div>

      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <ShieldCheck size={18} className="text-accent-green" />
          <h3 className="font-syne font-bold text-text-primary">{t('adm_dev_trusted')}</h3>
          <span className="ml-auto text-xs text-text-muted">{trusted.length} {t('unit_pcs')}</span>
        </div>
        {trusted.length === 0 ? (
          <div className="text-center py-10 text-text-muted text-sm">{t('adm_dev_no_trusted')}</div>
        ) : (
          <div className="divide-y divide-border">
            {trSlice.map(d => {
              const did = d.deviceId || d
              const owner = attempts.find(a => a.deviceId === did)
              return (
                <div key={did} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent-green/10 flex items-center justify-center flex-shrink-0">
                    <Shield size={14} className="text-accent-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {owner && <p className="text-sm font-semibold text-text-primary">{owner.fullName || owner.username}</p>}
                    <code className="text-xs text-text-secondary font-mono truncate block opacity-50">{did}</code>
                  </div>
                  <button onClick={() => removeTrusted(did)} className="p-1.5 hover:bg-accent-red/10 rounded-lg text-text-muted hover:text-accent-red transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
            <Pager page={trustedPage} total={trPages} setPage={setTrustedPage} itemCount={trusted.length} />
          </div>
        )}
      </div>

      {Object.keys(descriptors).length > 0 && (
        <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-3">
            <ScanFace size={18} className="text-accent-blue" />
            <h3 className="font-syne font-bold text-text-primary">{t('adm_dev_face_id')}</h3>
            <span className="ml-auto text-xs text-text-muted">{Object.keys(descriptors).length} {t('adm_dev_face_registered')}</span>
          </div>
          <div className="divide-y divide-border">
            {faceSlice.map(userId => (
              <div key={userId} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
                  <ScanFace size={14} className="text-accent-blue" />
                </div>
                <p className="flex-1 text-sm font-semibold text-text-primary">{faceIdOwner(userId)}</p>
                <button onClick={() => resetFaceId(userId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-accent-orange/30 text-accent-orange hover:bg-accent-orange/10 transition-colors">
                  <RotateCcw size={12} /> {t('adm_dev_re_register')}
                </button>
              </div>
            ))}
            <Pager page={facePage} total={facePages} setPage={setFacePage} itemCount={faceKeys.length} />
          </div>
        </div>
      )}

      <AnimatePresence>
        {selfieModal && (
          <ModalWrap onClose={() => setSelfieModal(null)} maxW="max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-syne font-bold text-text-primary">{selfieModal.fullName || selfieModal.username}</h3>
              <button onClick={() => setSelfieModal(null)} className="p-1.5 hover:bg-bg-tertiary rounded-lg"><X size={16} className="text-text-secondary" /></button>
            </div>
            <div className="p-4">
              <img src={selfieModal.selfie} alt="selfie" className="w-full rounded-xl" />
              <div className="mt-3 space-y-1">
                <p className="text-xs text-text-muted">{formatDateTime(selfieModal.timestamp)}</p>
                {parseUserAgent(selfieModal.userAgent) && <p className="text-xs text-text-secondary">{parseUserAgent(selfieModal.userAgent)}</p>}
                <p className="text-xs text-text-muted font-mono opacity-50">{selfieModal.deviceId}</p>
              </div>
            </div>
          </ModalWrap>
        )}
        {showClearAttempts && (
          <ModalWrap onClose={() => setShowClearAttempts(false)} maxW="max-w-sm">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-accent-red/10 rounded-2xl flex items-center justify-center mx-auto"><AlertTriangle size={28} className="text-accent-red"/></div>
              <div>
                <h3 className="font-syne font-bold text-lg">{t('adm_dev_clear_title')}</h3>
                <p className="text-text-secondary text-sm mt-1">{attempts.length} {t('adm_dev_clear_confirm')}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowClearAttempts(false)} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm">{t('cancel')}</button>
                <button onClick={clearAttempts} className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm">{t('adm_dev_clear')}</button>
              </div>
            </div>
          </ModalWrap>
        )}
      </AnimatePresence>
    </div>
  )
}


export default DevicesTab
