import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import DateMaskInput from '../../../components/DateMaskInput'
import { StackGuard } from '../../../components/ui/Modal'

// Manba va nasiya tashkiloti oynalari (avval Boshqaruv sahifasida edi)
const SalesRulesModals = ({ ctx }) => {
  const { t } = useTranslation()
  const {
    showSourceModal, setShowSourceModal, newSourceLabel, setNewSourceLabel, addSource,
    showOrgModal, setShowOrgModal, editingOrg, setEditingOrg, orgForm, setOrgForm, ALL_TERM_OPTIONS,
    addInstallmentOrg, updateInstallmentOrg,
    deleteSourceConfirm, setDeleteSourceConfirm, removeSource,
    deleteOrgConfirm, setDeleteOrgConfirm, removeInstallmentOrg,
  } = ctx
  return (
    <>
      <AnimatePresence>
        {showSourceModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <StackGuard onClose={() => setShowSourceModal(false)} />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSourceModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-sm shadow-2xl z-10"
            >
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
                <h3 className="font-syne font-bold text-lg text-text-primary">{t('mgmt_source_modal_title')}</h3>
                <button onClick={() => setShowSourceModal(false)} className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors">
                  <X size={18} className="text-text-secondary" />
                </button>
              </div>
              <div className="p-4 sm:p-5 space-y-4">
                <div>
                  <label className="text-text-secondary text-sm mb-1.5 block">{t('mgmt_source_field_name')} *</label>
                  <input
                    type="text"
                    value={newSourceLabel}
                    onChange={e => setNewSourceLabel(e.target.value)}
                    placeholder={t('mgmt_source_field_ph')}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red text-sm"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-3 p-4 sm:p-5 border-t border-border">
                <button onClick={() => setShowSourceModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-bg-tertiary transition-colors text-sm font-medium">
                  {t('mgmt_btn_cancel')}
                </button>
                <button
                  onClick={() => {
                    if (!newSourceLabel.trim()) return
                    addSource({ id: newSourceLabel.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(), label: newSourceLabel, isActive: true })
                    setShowSourceModal(false)
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  {t('emp_form_add_btn')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOrgModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <StackGuard onClose={() => setShowOrgModal(false)} />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowOrgModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-md shadow-2xl z-10"
            >
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
                <h3 className="font-syne font-bold text-lg text-text-primary">
                  {editingOrg ? t('mgmt_org_edit_title') : t('mgmt_org_add_title')}
                </h3>
                <button onClick={() => setShowOrgModal(false)} className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors">
                  <X size={18} className="text-text-secondary" />
                </button>
              </div>
              <div className="p-4 sm:p-5 space-y-4">
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{t('mgmt_org_field_name')} *</label>
                  <input
                    type="text"
                    value={orgForm.name}
                    onChange={e => setOrgForm(f => ({ ...f, name: e.target.value }))}
                    placeholder={t('mgmt_org_name_ph')}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:border-accent-red text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{t('mgmt_org_field_percent')}</label>
                  <input
                    type="number"
                    value={orgForm.commissionPercent}
                    onChange={e => setOrgForm(f => ({ ...f, commissionPercent: Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:border-accent-red text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{t('mgmt_org_field_schedule')}</label>
                  <select
                    value={orgForm.paymentSchedule}
                    onChange={e => setOrgForm(f => ({ ...f, paymentSchedule: e.target.value }))}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:border-accent-red text-xs font-semibold"
                  >
                    <option value="weekly_2x">{t('mgmt_schedule_weekly2x')}</option>
                    <option value="biweekly">{t('mgmt_schedule_biweekly')}</option>
                    <option value="custom">{t('mgmt_schedule_custom')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{t('mgmt_org_field_max_term')}</label>
                  <input
                    type="number"
                    value={orgForm.maxTermMonths}
                    onChange={e => setOrgForm(f => ({ ...f, maxTermMonths: Number(e.target.value) }))}
                    placeholder="12"
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:border-accent-red text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-text-secondary text-xs mb-2 block">{t('mgmt_org_field_terms')}</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_TERM_OPTIONS.map(opt => {
                      const selected = (orgForm.availableTerms || []).includes(opt.value)
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setOrgForm(f => ({
                            ...f,
                            availableTerms: selected
                              ? f.availableTerms.filter(v => v !== opt.value)
                              : [...(f.availableTerms || []), opt.value].sort((a, b) => a - b)
                          }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            selected
                              ? 'bg-accent-blue text-white border-accent-blue'
                              : 'bg-bg-tertiary border-border text-text-secondary hover:border-accent-blue'
                          }`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                  {(orgForm.availableTerms || []).length === 0 && (
                    <p className="text-[10px] text-text-muted mt-1.5">{t('mgmt_org_terms_hint')}</p>
                  )}
                </div>
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{t('mgmt_org_field_start')}</label>
                  <DateMaskInput
                    value={orgForm.startDate}
                    onChange={e => setOrgForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:border-accent-red text-xs font-semibold"
                  />
                </div>
              </div>
              <div className="flex gap-3 p-4 sm:p-5 border-t border-border">
                <button onClick={() => setShowOrgModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-bg-tertiary transition-colors text-sm font-medium">
                  {t('mgmt_btn_cancel')}
                </button>
                <button
                  onClick={() => {
                    if (!orgForm.name.trim()) return
                    if (editingOrg) {
                      updateInstallmentOrg(editingOrg.id, orgForm)
                    } else {
                      const newId = orgForm.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
                      addInstallmentOrg({
                        id: newId,
                        ...orgForm
                      })
                    }
                    setShowOrgModal(false)
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-glow-red"
                >
                  {editingOrg ? t('mgmt_btn_save') : t('emp_form_add_btn')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
                {deleteSourceConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <StackGuard onClose={() => setDeleteSourceConfirm(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-secondary border border-border p-4 sm:p-6 rounded-3xl max-w-sm w-full space-y-4 sm:space-y-6 shadow-2xl"
            >
              <div className="space-y-2">
                <h3 className="font-syne font-bold text-text-primary text-base">Manba o'chirish</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  <span className="font-bold text-text-primary">"{deleteSourceConfirm.label}"</span> manbasini o'chirasizmi? Bu amal qaytarib bo'lmaydi.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeleteSourceConfirm(null)}
                  className="py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary text-xs font-bold hover:bg-border transition-colors"
                >
                  Bekor
                </button>
                <button
                  onClick={() => { removeSource(deleteSourceConfirm.id); setDeleteSourceConfirm(null) }}
                  className="py-3 bg-accent-red text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-glow-red"
                >
                  O'chirish
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {deleteOrgConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <StackGuard onClose={() => setDeleteOrgConfirm(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-bg-secondary border border-border p-4 sm:p-6 rounded-3xl max-w-sm w-full space-y-4 sm:space-y-6 shadow-2xl"
            >
              <div className="space-y-2">
                <h3 className="font-syne font-bold text-text-primary text-base">{t('mgmt_org_delete_title')}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {t('mgmt_org_delete_confirm', { name: deleteOrgConfirm.name })}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeleteOrgConfirm(null)}
                  className="py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary text-xs font-bold hover:bg-border transition-colors"
                >
                  {t('mgmt_btn_cancel')}
                </button>
                <button
                  onClick={() => {
                    removeInstallmentOrg(deleteOrgConfirm.id)
                    setDeleteOrgConfirm(null)
                  }}
                  className="py-3 bg-accent-red text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-glow-red"
                >
                  {t('mgmt_btn_delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default SalesRulesModals
