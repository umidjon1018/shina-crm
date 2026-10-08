import { useTranslation } from 'react-i18next'
import { AlertCircle, Percent } from 'lucide-react'

// Qo'lda beriladigan chegirma chegaralari: sotuvchi o'zi beradi / boshqaruvchi tasdig'i / admin tasdig'i.
// Server ham shu chegaralarni tekshiradi (sotuvda).
const DiscountLevels = ({ ctx }) => {
  const { t } = useTranslation()
  const { discountForm, setDiscountForm, discountSaved, saveDiscounts } = ctx
  const invalid = Number(discountForm.discountSmallMax) >= Number(discountForm.discountMediumMax)
  const input = 'w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-xl focus:outline-none focus:border-accent-red text-sm font-semibold text-text-primary'
  return (
    <div className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-accent-orange/10 text-accent-orange rounded-xl flex items-center justify-center"><Percent size={20} /></div>
        <div>
          <h3 className="font-syne font-bold text-text-primary text-base">{t('mgmt_discount_levels_title')}</h3>
          <p className="text-xs text-text-muted">{t('mgmt_discount_subtitle')}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-text-primary">{t('mgmt_discount_small')}</label>
          <p className="text-xs text-text-muted">{t('mgmt_discount_small_hint')}</p>
          <input type="number" min="0" max="20" value={discountForm.discountSmallMax}
            onChange={e => setDiscountForm({ ...discountForm, discountSmallMax: Number(e.target.value) })} className={input} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-text-primary">{t('mgmt_discount_medium')}</label>
          <p className="text-xs text-text-muted">{t('mgmt_discount_medium_hint')}</p>
          <input type="number" min="0" max="40" value={discountForm.discountMediumMax}
            onChange={e => setDiscountForm({ ...discountForm, discountMediumMax: Number(e.target.value) })} className={input} />
        </div>
      </div>
      {invalid && (
        <div className="flex items-center gap-2 p-3 bg-accent-red/10 border border-accent-red/30 rounded-xl text-accent-red text-xs font-bold">
          <AlertCircle size={13} className="shrink-0" /> {t('mgmt_discount_level_error')}
        </div>
      )}
      <p className="text-sm text-text-secondary p-3 bg-bg-tertiary rounded-xl border border-border">
        {t('mgmt_discount_summary', { s: discountForm.discountSmallMax, s1: Number(discountForm.discountSmallMax) + 1, m: discountForm.discountMediumMax, m1: Number(discountForm.discountMediumMax) + 1 })}
      </p>
      <button onClick={saveDiscounts} disabled={invalid}
        className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 ${discountSaved ? 'bg-accent-green text-white' : 'bg-accent-red text-white hover:opacity-90 shadow-glow-red'}`}>
        {discountSaved ? t('mgmt_saved') : t('save')}
      </button>
    </div>
  )
}

export default DiscountLevels
