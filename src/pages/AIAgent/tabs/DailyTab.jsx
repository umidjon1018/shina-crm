import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, ChevronDown, ChevronUp, AlertCircle, AlertTriangle, BarChart3, ShieldAlert } from 'lucide-react'
import { getAiDigests, getAiAnomalies } from '../../../api/aiStatsService'
import { useShopStore } from '../../../store/shopStore'
import { useDataStore } from '../../../store/dataStore'
import { TAB_COLORS } from '../aiHelpers'
import { DigestBody, RunButton, useDigestRun, fmtWhen } from '../components/DigestCard'
import { AnomalyCard } from '../components/Anomalies'
import SectionData from '../components/SectionData'
import MarketingRoadmap from '../components/MarketingRoadmap'

const SECTIONS = ['sales', 'inventory', 'customers', 'marketing', 'staff']

function SectionItem({ section, digest, open, onToggle, onReloaded }) {
  const { t } = useTranslation()
  const [showData, setShowData] = useState(false)
  const { isAdmin, running, error, run } = useDigestRun(onReloaded)
  const c = TAB_COLORS[section]
  const danger = digest?.alerts?.filter(a => a.level === 'danger').length || 0
  const warn = digest?.alerts?.filter(a => a.level === 'warning').length || 0

  return (
    <div className={`rounded-xl border ${open ? c.border : 'border-border'} bg-bg-secondary overflow-hidden`}>
      <button type="button" onClick={onToggle} className="w-full text-left px-3 sm:px-4 py-3 flex items-start gap-3">
        <span className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${c.bg} border ${c.border}`} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className={`text-sm font-semibold ${c.text}`}>{t(`aisec_head_${section}`)}</span>
            {danger > 0 && <span className="flex items-center gap-0.5 text-[11px] text-accent-red"><AlertCircle size={11} />{danger}</span>}
            {warn > 0 && <span className="flex items-center gap-0.5 text-[11px] text-accent-orange"><AlertTriangle size={11} />{warn}</span>}
            {digest && <span className="text-[11px] text-text-muted">{t('aisec_recs_n', { n: digest.recommendations?.length || 0 })}</span>}
          </div>
          {!open && <p className="text-xs text-text-secondary mt-1 line-clamp-2">{digest?.summary || t('aisec_digest_none_short')}</p>}
        </div>
        {open ? <ChevronUp size={16} className="text-text-muted mt-0.5" /> : <ChevronDown size={16} className="text-text-muted mt-0.5" />}
      </button>

      {open && (
        <div className="px-3 sm:px-4 pb-4 space-y-4">
          <DigestBody digest={digest} />
          {error && <p className="text-xs text-accent-red">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowData(v => !v)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg-primary">
              <BarChart3 size={12} /> {showData ? t('aisec_hide_numbers') : t('aisec_show_numbers')}
            </button>
            {isAdmin && <RunButton running={running} onClick={() => run(section)} label={t('aisec_digest_run')} />}
          </div>
          {showData && <SectionData section={section} />}
          {section === 'marketing' && <MarketingRoadmap recommendations={digest?.recommendations || []} />}
        </div>
      )}
    </div>
  )
}

// Kundalik tahlilchi natijasi: 5 bo'lim bitta sahifada + bazadan aniqlangan muammolar
export default function DailyTab() {
  const { t } = useTranslation()
  const { selectedShopId } = useShopStore()
  const { version } = useDataStore()
  const [data, setData] = useState(null)
  const [anomalies, setAnomalies] = useState([])
  const [openMap, setOpenMap] = useState(null)
  const [showAnom, setShowAnom] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const load = useCallback(() => {
    getAiDigests().then(d => {
      setData(d)
      // Birinchi ochilishda: jiddiy ogohlantirishi bor bo'limlar (bo'lmasa Savdo) ochiq
      setOpenMap(prev => {
        if (prev) return prev
        const withDanger = SECTIONS.filter(s => d.digests?.[s]?.alerts?.some(a => a.level === 'danger'))
        return Object.fromEntries((withDanger.length ? withDanger : ['sales']).map(s => [s, true]))
      })
    }).catch(err => setLoadError(err?.response?.data?.error || err.message))
  }, [])

  useEffect(() => { load() }, [load, version])
  useEffect(() => {
    getAiAnomalies({ shop: selectedShopId }).then(setAnomalies).catch(() => setAnomalies([]))
  }, [selectedShopId, version])

  const { isAdmin, running, error, run } = useDigestRun(load)
  const digests = data?.digests || {}
  const latest = Object.values(digests).map(d => d.createdAt).sort().pop()
  const last = data?.status?.last

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={15} className="text-accent-blue flex-shrink-0" />
          <p className="text-sm font-semibold text-text-primary">{t('aisec_daily_title')}</p>
          {latest && <span className="text-[11px] text-text-muted">{t('aisec_updated_at', { when: fmtWhen(latest) })}</span>}
        </div>
        {isAdmin && <RunButton running={running || !!data?.status?.running} onClick={() => run()} label={t('aisec_digest_run_all')} />}
      </div>
      {(error || loadError) && <p className="text-xs text-accent-red">{error || loadError}</p>}
      {last?.status === 'failed' && !running && <p className="text-xs text-accent-red">{t('aisec_digest_failed')}: {String(last.error || '').slice(0, 160)}</p>}

      {anomalies.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-secondary">
          <button type="button" onClick={() => setShowAnom(v => !v)} className="w-full flex items-center justify-between gap-2 px-3 sm:px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <ShieldAlert size={15} className="text-accent-orange" /> {t('aisec_attention', { n: anomalies.length })}
            </span>
            {showAnom ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
          </button>
          {showAnom && (
            <div className="px-3 sm:px-4 pb-4 grid grid-cols-1 lg:grid-cols-2 gap-2">
              {anomalies.map(a => <AnomalyCard key={a.code} a={a} t={t} />)}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2 sm:space-y-3">
        {SECTIONS.map(s => (
          <SectionItem key={s} section={s} digest={digests[s] || null} onReloaded={load}
            open={!!openMap?.[s]} onToggle={() => setOpenMap(m => ({ ...(m || {}), [s]: !m?.[s] }))} />
        ))}
      </div>
      <p className="text-[11px] text-text-muted">{t('aisec_daily_hint')}</p>
    </div>
  )
}
