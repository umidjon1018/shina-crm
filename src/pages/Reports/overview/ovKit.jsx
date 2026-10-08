import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useShopStore } from '../../../store/shopStore'
import { useDataStore } from '../../../store/dataStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { presetRange } from '../../../utils/period'
import { errorText } from '../../../components/ui/Toast'

// Server hisobotlari uchun umumiy: davr + global do'kon, yuklash holati
export const useOverview = (fetcher, { period = true } = {}) => {
  const { selectedShopId } = useShopStore()
  const { version } = useDataStore()
  const [preset, setPreset] = useState('month')
  const [range, setRange] = useState(presetRange('month'))
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let alive = true
    setError('')
    fetcher({ ...(period ? { from: range.from, to: range.to } : {}), shop_id: selectedShopId })
      .then(d => { if (alive) setData(d) })
      .catch(e => { if (alive) setError(errorText(e, 'Error')) })
    return () => { alive = false }
  }, [range.from, range.to, selectedShopId, version])
  return { preset, range, setPeriod: (p, r) => { setPreset(p); setRange(r) }, data, error }
}

export const money = (v) => Math.round(Number(v) || 0).toLocaleString('uz-UZ')
export const qtyFmt = (v) => String(Math.round((Number(v) || 0) * 1000) / 1000).replace('.', ',')
export const delta = (cur, prev) => (Number(prev) > 0 ? Math.round((Number(cur) - Number(prev)) / Number(prev) * 1000) / 10 : null)
export const daysAgo = (ymd, today) => (ymd ? Math.round((new Date(today + 'T00:00:00Z') - new Date(ymd.slice(0, 10) + 'T00:00:00Z')) / 86400000) : null)
export const dmy = (s) => (s ? s.slice(0, 10).split('-').reverse().join('.') + (s.length > 10 ? ' ' + s.slice(11, 16) : '') : '—')

export const useLabels = () => {
  const { t, i18n } = useTranslation()
  const cats = useSettingsStore(s => s.productCategories) || []
  const RU = { tire: 'Шины', wheel: 'Диски', accessory: 'Аксессуары', other: 'Прочее' }
  return {
    month: (k) => (k ? `${t('rep_month_' + parseInt(k.slice(5, 7), 10))} ${k.slice(0, 4)}` : '—'),
    monthShort: (k) => (k ? `${t('rep_month_' + parseInt(k.slice(5, 7), 10)).slice(0, 3)} ${k.slice(2, 4)}` : ''),
    cat: (id) => {
      if (i18n.language === 'ru' && RU[id]) return RU[id]
      return cats.find(c => c.id === id)?.label || (id === 'other' ? t('ov_other') : id || '—')
    },
    pay: (k) => ({ cash: t('pay_cash'), card: t('pay_card'), installment: t('pay_installment'), transfer: t('sl_hist_pay_bank') }[k] || k),
    source: (k) => ({ instagram: 'Instagram', telegram: 'Telegram', repeat: t('rep_src_repeat'), walk_in: t('rep_src_walk_in'), referral: t('rep_src_referral') }[k] || k || '—'),
    reason: (k) => ({ almashtirish: t('rep_almashtirilgan'), narx_mos_emas: t('sl_cancel_r_price'), tovar_yoq: t('rep_cancel_tovar_yoq'),
      mijoz_fikr_ozgartirdi: t('rep_cancel_mijoz'), boshqa: t('rep_cancel_boshqa'), refund: t('rep_cancel_refund'), qaytarish: t('rep_cancel_refund') }[k] || k || '—'),
    catStd: (id) => cats.find(c => c.id === id)?.turnoverDays || { tire: 45, wheel: 60 }[id] || 30,
  }
}

export const Spinner = () => <div className="py-16 flex justify-center"><div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" /></div>
export const ErrorBox = ({ error }) => (error ? <div className="text-sm text-accent-red bg-accent-red/10 px-4 py-3 rounded-xl">{error}</div> : null)

// Ro'yxatdan bitta ko'rsatkich bo'yicha kichik reyting (nomi — qiymat — ulush)
export const RankList = ({ rows, valueKey = 'value', labelKey = 'label', fmt = money, sub }) => {
  const max = Math.max(1, ...rows.map(r => Number(r[valueKey]) || 0))
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-text-primary font-medium truncate">{r[labelKey]}</span>
            <span className="text-text-primary font-bold whitespace-nowrap">{fmt(r[valueKey])}{sub ? <span className="text-text-muted font-normal"> · {sub(r)}</span> : null}</span>
          </div>
          <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[#2BD4F0] to-[#A86BFF]" style={{ width: `${Math.max(2, (Number(r[valueKey]) || 0) / max * 100)}%` }} />
          </div>
        </div>
      ))}
      {!rows.length && <p className="text-sm text-text-muted">—</p>}
    </div>
  )
}

// Filtr tugmalari
export const Chips = ({ items, value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {items.map(it => (
      <button key={it.id} type="button" onClick={() => onChange(it.id)}
        className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors ${value === it.id ? 'bg-accent-red text-white border-accent-red' : 'border-border text-text-secondary hover:bg-bg-tertiary'}`}>
        {it.label}{it.count !== undefined ? <span className="opacity-70"> · {it.count}</span> : null}
      </button>
    ))}
  </div>
)
