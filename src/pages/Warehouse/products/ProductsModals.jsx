import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

// Kategoriya qo'shish va o'chirish oynalari (avval Boshqaruv sahifasida edi)
const ProductsModals = ({ ctx }) => {
  const { t } = useTranslation()
  const {
    showCategoryForm, setShowCategoryForm, newCategory, setNewCategory, addProductCategory,
    deleteCategoryConfirm, setDeleteCategoryConfirm, removeProductCategory,
  } = ctx
  return (
    <>
      <AnimatePresence>
        {showCategoryForm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCategoryForm(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-sm shadow-2xl z-10"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-syne font-bold text-text-primary text-base">{t('mgmt_add_category')}</h3>
                <button onClick={() => setShowCategoryForm(false)} className="p-1 hover:bg-bg-tertiary rounded-lg">
                  <X size={16} className="text-text-secondary" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{t('mgmt_cat_name_label')} *</label>
                  <input
                    type="text"
                    value={newCategory.label}
                    onChange={e => setNewCategory({ ...newCategory, label: e.target.value })}
                    placeholder={t('mgmt_cat_name_ph')}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary text-xs focus:outline-none focus:border-accent-red font-semibold"
                  />
                </div>
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">{t('mgmt_cat_turnover_label')} *</label>
                  <input
                    type="number"
                    value={newCategory.turnoverDays}
                    onChange={e => setNewCategory({ ...newCategory, turnoverDays: Number(e.target.value) })}
                    className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-text-primary text-xs focus:outline-none focus:border-accent-red font-semibold"
                  />
                </div>
              </div>
              <div className="flex gap-2 p-4 border-t border-border">
                <button onClick={() => setShowCategoryForm(false)}
                  className="flex-1 py-2 rounded-xl border border-border text-text-secondary hover:bg-bg-tertiary transition-colors text-xs font-semibold">
                  {t('mgmt_btn_cancel')}
                </button>
                <button
                  onClick={() => {
                    if (!newCategory.label.trim()) return
                    addProductCategory({
                      id: newCategory.label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
                      label: newCategory.label,
                      turnoverDays: newCategory.turnoverDays
                    })
                    setShowCategoryForm(false)
                  }}
                  className="flex-1 py-2 rounded-xl bg-accent-red text-white font-bold text-xs hover:opacity-90 transition-opacity shadow-glow-red"
                >
                  {t('save')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {deleteCategoryConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg-secondary border border-border p-4 sm:p-6 rounded-3xl max-w-sm w-full space-y-4 sm:space-y-6 shadow-2xl"
            >
              <div className="space-y-2">
                <h3 className="font-syne font-bold text-text-primary text-base">Kategoriya o'chirish</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  <span className="font-bold text-text-primary">"{deleteCategoryConfirm.label}"</span> kategoriyasini o'chirasizmi?
                  Ombordagi mavjud tovarlar va savdo tarixi saqlanib qoladi — faqat yangi kirimlarda bu kategoriya ko'rinmaydi.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeleteCategoryConfirm(null)}
                  className="py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary text-xs font-bold hover:bg-border transition-colors"
                >
                  Bekor
                </button>
                <button
                  onClick={() => { removeProductCategory(deleteCategoryConfirm.id); setDeleteCategoryConfirm(null) }}
                  className="py-3 bg-accent-red text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-glow-red"
                >
                  O'chirish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default ProductsModals
