import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Store } from 'lucide-react'
import { useShopStore } from '../store/shopStore'

export const ShopPickerModal = ({ onConfirm, onCancel }) => {
  const { t } = useTranslation()
  const { shops } = useShopStore()
  const activeShops = shops.filter(s => s.isActive)
  const [picked, setPicked] = useState(activeShops[0]?.id || '')

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-secondary border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-red/10 flex items-center justify-center">
            <Store size={20} className="text-accent-red" />
          </div>
          <div>
            <p className="font-syne font-bold text-text-primary">{t('shop_pick_title')}</p>
            <p className="text-xs text-text-muted">{t('shop_pick_sub')}</p>
          </div>
        </div>

        <select
          value={picked}
          onChange={e => setPicked(e.target.value)}
          className="w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red"
        >
          {activeShops.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all text-sm font-medium"
          >
            {t('cancel')}
          </button>
          <button
            onClick={() => picked && onConfirm(picked)}
            disabled={!picked}
            className="flex-1 py-2.5 rounded-xl bg-accent-red text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}
