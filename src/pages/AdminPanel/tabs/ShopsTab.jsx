import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, AlertTriangle, ArrowRight, MapPin, Pencil, Plus, Store, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react'
import { useShopStore } from '../../../store/shopStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { useAuditStore } from '../../../store/auditStore'
import { useAuthStore } from '../../../store/authStore'
import api from '../../../api/client'
import { Badge, ModalWrap, MONTHS_UZ, MONTHS_RU } from '../apHelpers.jsx'

function ShopsTab() {
  const { t, i18n } = useTranslation()
  const { shops, addShop, updateShop, removeShop, loadShops } = useShopStore()
  const { employees } = useSettingsStore()
  const MONTHS = i18n.language === 'ru' ? MONTHS_RU : MONTHS_UZ
  const [showShopForm, setShowShopForm] = useState(false)
  const [editingShop, setEditingShop] = useState(null)
  const [shopDeleteTarget, setShopDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [transferMode, setTransferMode] = useState(false)
  const [transferTargetId, setTransferTargetId] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [shopForm, setShopForm] = useState({
    name: '', address: '', isActive: true,
    googleMapLink: '', yandexMapLink: '', openTime: '08:00', closeTime: '22:00', managerId: ''
  })

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xl font-syne font-bold text-text-primary">{t('mgmt_shops_title')}</h3>
          <p className="text-sm text-text-secondary">{t('mgmt_shops_subtitle')}</p>
        </div>
        <button
          onClick={() => {
            setShopForm({ name: '', address: '', isActive: true, googleMapLink: '', yandexMapLink: '', openTime: '08:00', closeTime: '22:00', managerId: '' })
            setEditingShop(null)
            setShowShopForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-red text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-glow-red"
        >
          <Plus size={15} /> {t('mgmt_add_shop')}
        </button>
      </div>

      {/* Shops list */}
      <div className="space-y-3">
        {shops.map((shop, idx) => (
          <motion.div
            key={shop.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-bg-secondary border border-border rounded-2xl p-4 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${shop.isActive ? 'bg-accent-red/10 text-accent-red' : 'bg-bg-tertiary text-text-secondary'}`}>
              <Store size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-syne font-bold text-text-primary truncate">{shop.name}</p>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0 ${shop.isActive ? 'bg-accent-green/10 text-accent-green' : 'bg-bg-tertiary text-text-secondary'}`}>
                  {shop.isActive ? t('mgmt_shop_active') : t('mgmt_shop_inactive')}
                </span>
              </div>
              {shop.address && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={11} className="text-text-secondary flex-shrink-0" />
                  <p className="text-text-secondary text-sm truncate">{shop.address}</p>
                </div>
              )}
              {(shop.openTime || shop.closeTime) && (
                <p className="text-text-secondary text-xs mt-0.5">🕐 {shop.openTime || '08:00'} — {shop.closeTime || '22:00'}</p>
              )}
              {(shop.googleMapLink || shop.yandexMapLink) && (
                <div className="flex gap-3 mt-1.5">
                  {shop.googleMapLink && (
                    <a href={shop.googleMapLink} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-blue hover:underline flex items-center gap-0.5">
                      Google Maps ↗
                    </a>
                  )}
                  {shop.yandexMapLink && (
                    <a href={shop.yandexMapLink} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-orange hover:underline flex items-center gap-0.5">
                      Yandex Maps ↗
                    </a>
                  )}
                </div>
              )}
              <p className="text-text-secondary text-xs mt-0.5 opacity-60">{t('mgmt_shop_added')} {(() => { if (!shop.createdAt) return '—'; const dt = new Date(shop.createdAt); return isNaN(dt) ? shop.createdAt : `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}` })()}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => updateShop(shop.id, { isActive: !shop.isActive })}
                className={`p-2 rounded-lg transition-colors ${shop.isActive ? 'hover:bg-accent-red/10 hover:text-accent-red text-text-secondary' : 'hover:bg-accent-green/10 hover:text-accent-green text-text-secondary'}`}
                title={shop.isActive ? t('mgmt_shop_deactivate') : t('mgmt_shop_activate')}
              >
                {shop.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              </button>
              <button
                onClick={() => {
                  setShopForm({ name: shop.name, address: shop.address || '', isActive: shop.isActive, googleMapLink: shop.googleMapLink || '', yandexMapLink: shop.yandexMapLink || '', openTime: shop.openTime || '08:00', closeTime: shop.closeTime || '22:00', managerId: shop.managerId || '' })
                  setEditingShop(shop)
                  setShowShopForm(true)
                }}
                className="p-2 rounded-lg hover:bg-blue-500/10 hover:text-blue-400 text-text-secondary transition-colors"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setShopDeleteTarget(shop)}
                className="p-2 rounded-lg hover:bg-accent-red/10 hover:text-accent-red text-text-secondary transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Eslatma */}
      <div className="flex items-start gap-3 p-4 bg-bg-secondary border border-border rounded-2xl">
        <AlertCircle size={16} className="text-text-secondary mt-0.5 flex-shrink-0" />
        <p className="text-text-secondary text-sm">{t('mgmt_shop_note')}</p>
      </div>

      {/* Shop form modal */}
      <AnimatePresence>
        {showShopForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowShopForm(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-md shadow-2xl z-10"
            >
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
                <h3 className="font-syne font-bold text-lg text-text-primary">
                  {editingShop ? t('mgmt_shop_edit_title') : t('mgmt_shop_add_title')}
                </h3>
                <button onClick={() => setShowShopForm(false)} className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors">
                  <X size={18} className="text-text-secondary" />
                </button>
              </div>
              <div className="p-4 sm:p-5 space-y-4 max-h-[65vh] overflow-y-auto">
                <div>
                  <label className="text-text-secondary text-sm mb-1.5 block">{t('mgmt_shop_field_name')}</label>
                  <input type="text" value={shopForm.name} onChange={e => setShopForm(f => ({ ...f, name: e.target.value }))} placeholder="GoodTires ..." className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red text-sm" />
                </div>
                <div>
                  <label className="text-text-secondary text-sm mb-1.5 block">{t('col_address')}</label>
                  <input type="text" value={shopForm.address} onChange={e => setShopForm(f => ({ ...f, address: e.target.value }))} placeholder={t('mgmt_shop_address_ph')} className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red text-sm" />
                </div>
                <div>
                  <label className="text-text-secondary text-sm mb-1.5 block">{t('mgmt_shop_field_google')}</label>
                  <input type="text" value={shopForm.googleMapLink || ''} onChange={e => setShopForm(f => ({ ...f, googleMapLink: e.target.value }))} placeholder="https://maps.google.com/..." className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red text-xs font-semibold" />
                </div>
                <div>
                  <label className="text-text-secondary text-sm mb-1.5 block">{t('mgmt_shop_field_yandex')}</label>
                  <input type="text" value={shopForm.yandexMapLink || ''} onChange={e => setShopForm(f => ({ ...f, yandexMapLink: e.target.value }))} placeholder="https://yandex.ru/maps/..." className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red text-xs font-semibold" />
                </div>
                <div>
                  <label className="text-text-secondary text-sm mb-1.5 block">{t('mgmt_shop_field_hours')}</label>
                  <div className="flex items-center gap-2">
                    <input type="time" value={shopForm.openTime || '08:00'} onChange={e => setShopForm(f => ({ ...f, openTime: e.target.value }))} className="flex-1 bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red text-xs font-semibold" />
                    <span className="text-text-secondary text-sm">—</span>
                    <input type="time" value={shopForm.closeTime || '22:00'} onChange={e => setShopForm(f => ({ ...f, closeTime: e.target.value }))} className="flex-1 bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red text-xs font-semibold" />
                  </div>
                </div>
                {(() => {
                  const managers = employees.filter(e => e.isActive && ['manager','admin'].includes(e.role))
                  return managers.length > 0 ? (
                    <div>
                      <label className="text-text-secondary text-sm mb-1.5 block">{t('mgmt_shop_field_manager')}</label>
                      <select value={shopForm.managerId} onChange={e => setShopForm(f => ({ ...f, managerId: e.target.value }))} className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red text-sm">
                        <option value="">{t('mgmt_shop_no_manager')}</option>
                        {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  ) : null
                })()}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setShopForm(f => ({ ...f, isActive: !f.isActive }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${shopForm.isActive ? 'border-accent-green bg-accent-green/10 text-accent-green' : 'border-border bg-bg-tertiary text-text-secondary'}`}
                  >
                    {shopForm.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    {shopForm.isActive ? t('mgmt_shop_active') : t('mgmt_shop_inactive')}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 p-4 sm:p-5 border-t border-border">
                <button onClick={() => setShowShopForm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-bg-tertiary transition-colors text-sm font-medium">
                  {t('mgmt_btn_cancel')}
                </button>
                <button
                  onClick={async () => {
                    if (!shopForm.name.trim()) return
                    try {
                      if (editingShop) await updateShop(editingShop.id, shopForm)
                      else await addShop(shopForm)
                      setShowShopForm(false)
                    } catch (e) {
                      alert('Xatolik: ' + (e?.response?.data?.error || e?.message || 'Noma\'lum xato'))
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  {editingShop ? t('mgmt_btn_save') : t('emp_form_add_btn')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {shopDeleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShopDeleteTarget(null); setDeleteError(''); setTransferMode(false); setTransferTargetId('') }} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-sm shadow-2xl z-10 p-4 sm:p-6"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-accent-red/10 flex items-center justify-center">
                  <Trash2 size={24} className="text-accent-red" />
                </div>
                <div>
                  <h3 className="font-syne font-bold text-lg text-text-primary">{t('mgmt_shop_delete_title')}</h3>
                  <p className="text-text-secondary text-sm mt-1 font-semibold">{shopDeleteTarget.name}</p>
                  <p className="text-text-secondary text-xs mt-1">{t('mgmt_shop_delete_warning')}</p>
                </div>
                {transferMode && (
                  <div className="w-full space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-accent-orange/10 border border-accent-orange/20 rounded-xl text-accent-orange text-xs text-left">
                      <AlertTriangle size={14} className="flex-shrink-0" />
                      <span>{t('mgmt_shop_has_data_warning')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight size={14} className="text-text-secondary flex-shrink-0" />
                      <select
                        value={transferTargetId}
                        onChange={e => setTransferTargetId(e.target.value)}
                        className="flex-1 bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent-red"
                      >
                        <option value="">{t('mgmt_shop_transfer_placeholder')}</option>
                        {shops.filter(s => String(s.id) !== String(shopDeleteTarget?.id)).map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                {deleteError && (
                  <div className="w-full flex items-start gap-2 p-3 bg-accent-red/10 border border-accent-red/20 rounded-xl text-accent-red text-xs text-left">
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>{deleteError}</span>
                  </div>
                )}
                <div className="flex gap-3 w-full">
                  <button onClick={() => { setShopDeleteTarget(null); setDeleteError('') }} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-bg-tertiary transition-colors text-sm font-medium">
                    {t('mgmt_btn_cancel')}
                  </button>
                  <button
                    disabled={isDeleting}
                    onClick={async () => {
                      if (transferMode) {
                        if (!transferTargetId) return setDeleteError(t('mgmt_shop_transfer_select'))
                        setIsDeleting(true)
                        try {
                          await api.post(`/api/shops/${shopDeleteTarget.id}/transfer-and-delete`, { targetShopId: Number(transferTargetId) })
                          await loadShops()
                          setShopDeleteTarget(null); setTransferMode(false); setTransferTargetId(''); setDeleteError('')
                        } catch (e) {
                          setDeleteError(e?.response?.data?.error || t('mgmt_shop_delete_error'))
                        } finally { setIsDeleting(false) }
                        return
                      }
                      setIsDeleting(true)
                      try {
                        await removeShop(shopDeleteTarget.id)
                        setShopDeleteTarget(null); setDeleteError('')
                      } catch (e) {
                        const code = e?.response?.data?.error
                        if (code === 'SHOP_HAS_DATA') {
                          const others = shops.filter(s => String(s.id) !== String(shopDeleteTarget.id))
                          if (others.length === 0) {
                            setDeleteError(t('mgmt_shop_only_one_has_data'))
                          } else {
                            setTransferMode(true)
                            setDeleteError('')
                          }
                        } else {
                          setDeleteError(code || e?.message || t('mgmt_shop_delete_error'))
                        }
                      } finally { setIsDeleting(false) }
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {transferMode ? t('mgmt_shop_transfer_and_delete') : t('mgmt_btn_delete')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}


export default ShopsTab
