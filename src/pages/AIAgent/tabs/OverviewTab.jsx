import { useEffect, useState } from 'react'
import { TrendingUp, Megaphone, Users, Package, Activity, UserCheck, Globe, Play, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { useDataStore } from '../../../store/dataStore'
import { TAB_COLORS } from '../aiHelpers'
import AgentActivityFeed from '../components/ActivityFeed'
import { getAllAgentsStatus, triggerAgentRun } from '../../../api/agentRunService'

const AGENT_DEFS = [
  { id: 'sales',     slug: 'sales-agent',     label: 'Savdo agenti',             Icon: TrendingUp, emptyLabel: 'Savdo tahlili' },
  { id: 'inventory', slug: 'product-agent',   label: 'Tovar bazasi agenti',      Icon: Package,    emptyLabel: 'Inventar tahlili' },
  { id: 'marketing', slug: 'pr-agent',        label: 'PR/Marketing agenti',      Icon: Megaphone,  emptyLabel: 'Marketing tahlili' },
  { id: 'customer',  slug: 'customer-agent',  label: 'Mijozlar agenti',          Icon: Users,      emptyLabel: 'Mijozlar tahlili' },
  { id: 'staff',     slug: 'staff-agent',     label: 'Xodimlar faoliyat agenti', Icon: UserCheck,  emptyLabel: 'Xodimlar tahlili' },
  { id: 'instagram', slug: 'instagram-agent', label: 'Instagram agenti',         Icon: Globe,      emptyLabel: 'Instagram bot' },
]

function fmtAgo(iso) {
  if (!iso) return null
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (diff < 1) return 'hozirgina'
  if (diff < 60) return diff + ' daqiqa oldin'
  if (diff < 1440) return Math.floor(diff / 60) + ' soat oldin'
  return Math.floor(diff / 1440) + ' kun oldin'
}

function StatusDot({ status }) {
  if (status === 'running') return <Loader2 size={10} className="text-blue-400 animate-spin" />
  if (status === 'completed') return <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
  if (status === 'failed') return <div className="w-2 h-2 rounded-full bg-[#E63946]" />
  return <div className="w-2 h-2 rounded-full bg-text-muted" />
}

function AgentCard({ def, runInfo, onTabChange, onRun, isRunning }) {
  const { id, slug, label, Icon, emptyLabel } = def
  const color = TAB_COLORS[id]
  const hasRun = !!runInfo

  return (
    <div className={`flex flex-col text-left p-4 rounded-xl border ${color.border} ${color.bg}`}>
      <div className="flex items-start justify-between mb-3">
        <button
          onClick={() => onTabChange(id)}
          className={`w-9 h-9 rounded-xl ${color.bg} flex items-center justify-center border ${color.border} hover:scale-105 transition-transform`}
        >
          <Icon size={16} className={color.text} />
        </button>
        <button
          onClick={() => onRun(slug)}
          disabled={isRunning}
          title="Agentni ishga tushirish"
          className={`p-1.5 rounded-lg transition-colors ${isRunning ? 'text-text-muted cursor-not-allowed' : 'text-text-muted hover:text-text-primary hover:bg-bg-secondary'}`}
        >
          {isRunning ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
        </button>
      </div>

      <button onClick={() => onTabChange(id)} className="text-left flex-1">
        {hasRun ? (
          <>
            <p className={`text-lg font-bold font-syne ${color.text} leading-tight`}>
              {runInfo.insight_count != null ? `${runInfo.insight_count} ta` : '—'}
            </p>
            <p className="text-xs text-text-secondary mt-1 truncate">
              {fmtAgo(runInfo.finished_at) || 'tugallandi'}
            </p>
          </>
        ) : (
          <>
            <p className={`text-lg font-bold font-syne ${color.text}`}>—</p>
            <p className="text-xs text-text-secondary mt-1">{emptyLabel}</p>
          </>
        )}
        <p className="text-sm text-text-primary mt-2 font-medium truncate">{label}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <StatusDot status={runInfo?.status} />
          <span className="text-xs text-text-secondary">
            {isRunning ? 'Ishlamoqda...' : hasRun ? (runInfo.status === 'failed' ? 'Xato' : 'Tayyor') : 'Ishga tushirilmagan'}
          </span>
        </div>
      </button>
    </div>
  )
}

function OverviewTab({ onTabChange }) {
  const { activities } = useAgentActivityStore()
  const { version } = useDataStore()
  void version; void activities

  const [statusMap, setStatusMap] = useState({})
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [runningSet, setRunningSet] = useState(new Set())

  const fetchStatus = async () => {
    try {
      const list = await getAllAgentsStatus()
      const map = {}
      list.forEach(r => { map[r.agent_slug] = r })
      setStatusMap(map)
      // Running agentlar hali ham running bo'lsa saqla, aks holda o'chir
      setRunningSet(prev => {
        const next = new Set()
        prev.forEach(slug => { if (map[slug]?.status === 'running') next.add(slug) })
        return next
      })
    } catch {}
    setLoadingStatus(false)
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 6000)
    return () => clearInterval(interval)
  }, [])

  const handleRun = async (slug) => {
    try {
      setRunningSet(prev => new Set([...prev, slug]))
      await triggerAgentRun(slug)
      setTimeout(fetchStatus, 1500)
    } catch (err) {
      setRunningSet(prev => { const n = new Set(prev); n.delete(slug); return n })
    }
  }

  const completedCount = Object.values(statusMap).filter(r => r.status === 'completed').length
  const failedCount    = Object.values(statusMap).filter(r => r.status === 'failed').length
  const runningCount   = Object.values(statusMap).filter(r => r.status === 'running').length + runningSet.size

  return (
    <div className="space-y-6">
      {/* Holat qatori */}
      <div className="flex items-center gap-4 p-3 rounded-xl border border-border bg-bg-secondary text-xs text-text-secondary flex-wrap">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 size={13} className="text-[#22c55e]" /> {completedCount} tayyor
        </span>
        {runningCount > 0 && (
          <span className="flex items-center gap-1.5">
            <Loader2 size={13} className="text-blue-400 animate-spin" /> {runningCount} ishlamoqda
          </span>
        )}
        {failedCount > 0 && (
          <span className="flex items-center gap-1.5">
            <XCircle size={13} className="text-[#E63946]" /> {failedCount} xato
          </span>
        )}
        <span className="text-text-muted ml-auto">Har kuni 06:00 da avtomatik ishlaydi</span>
        {loadingStatus && <Loader2 size={12} className="animate-spin text-text-muted" />}
      </div>

      {/* Agent kartalar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {AGENT_DEFS.map(def => (
          <AgentCard
            key={def.id}
            def={def}
            runInfo={statusMap[def.slug] || null}
            onTabChange={onTabChange}
            onRun={handleRun}
            isRunning={runningSet.has(def.slug) || statusMap[def.slug]?.status === 'running'}
          />
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Activity size={15} className="text-purple-400" /> Barcha agentlar faoliyati
        </h3>
        <AgentActivityFeed />
      </div>
    </div>
  )
}

export default OverviewTab
