import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence } from 'framer-motion'
import { AlertTriangle, Ban, CheckSquare, ScanFace, ShieldAlert, Smartphone, User, X, XSquare } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
import { useAuditStore } from '../../../store/auditStore'
import api from '../../../api/client'
import { MONTHS_UZ, MONTHS_RU, formatDateTimeWithMonths, Badge, ModalWrap } from '../apHelpers.jsx'

function DevicesTab() {
  const { t, i18n } = useTranslation()
  const MONTHS = i18n.language === 'ru' ? MONTHS_RU : MONTHS_UZ
  const formatDateTime = (d) => formatDateTimeWithMonths(d, MONTHS)
  const { approveDevice, rejectDevice, revokeDevice } = useAuthStore()
  const { addLog } = useAuditStore()
  const { user: me } = useAuthStore()
  const [attempts, setAttempts] = useState([])
  const [selfieModal, setSelfieModal] = useState(null)
  const [showClearAttempts, setShowClearAttempts] = useState(false)
  const PAGE_SIZE = 5
  const [attPage, setAttPage] = useState(1)

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
  }
  useEffect(() => { load() }, [])
  // Yangi kirish urinishi yoki holat o'zgarishi — ro'yxat darhol yangilanadi
  useEffect(() => {
    const onChange = () => load()
    window.addEventListener('shina:attempts-changed', onChange)
    return () => window.removeEventListener('shina:attempts-changed', onChange)
  }, [])

  const clearAttempts = async () => {
    try { await api.delete('/api/auth/attempts') } catch {}
    addLog({ userId: me?.id, userName: me?.fullName || me?.username, action: 'Kirish tarixi tozalandi', actionKey: 'audit_login_history_cleared', entity: 'device', details: `${attempts.length} ta yozuv` })
    setAttempts([])
    setShowClearAttempts(false)
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
  const needsAttention = attempts.filter(a => !a.isTrusted && (a.status === 'pending' || a.status === 'face_review')).length

  const attPages  = Math.max(1, Math.ceil(attempts.length / PAGE_SIZE))
  const attSlice  = attempts.slice((attPage - 1) * PAGE_SIZE, attPage * PAGE_SIZE)

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
    <div className="space-y-4 sm:space-y-6">
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
              const isPending = !a.isTrusted && (a.status === 'pending' || a.status === 'face_review')
              const isFaceReview = a.status === 'face_review'
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
                    {a.faceMatch === false && !isFaceReview && <Badge color="bg-accent-red/10 text-accent-red">{t('adm_dev_face_mismatch')}</Badge>}
                    {isFaceReview && <Badge color="bg-accent-orange/10 text-accent-orange">5× FaceID — vizual tasdiqlash kerak</Badge>}
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
                        {isFaceReview && a.selfie && (
                          <button onClick={() => setSelfieModal(a)} className="flex items-center gap-1 px-2 py-1.5 bg-accent-blue/10 text-accent-blue text-xs font-bold rounded-xl hover:bg-accent-blue/20 border border-accent-blue/30">
                            <ScanFace size={12} /> Ko'rish
                          </button>
                        )}
                        <button onClick={() => approve(a)} className="flex items-center gap-1 px-3 py-1.5 bg-accent-green/10 text-accent-green text-xs font-bold rounded-xl hover:bg-accent-green/20 border border-accent-green/30">
                          <CheckSquare size={12} /> {isFaceReview ? 'O\'zim' : t('confirm')}
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
            <div className="p-4 sm:p-6 text-center space-y-4">
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
