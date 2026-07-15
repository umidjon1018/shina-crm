import { useMemo } from 'react'
import { TrendingUp, Megaphone, Users, Package, Activity, UserCheck, Zap, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import { TAB_COLORS } from '../aiHelpers'
import AgentActivityFeed from '../components/ActivityFeed'

const AGENT_IDS = {
  sales:     'sales-agent',
  inventory: 'inventory-agent',
  marketing: 'marketing-agent',
  customer:  'customer-agent',
  staff:     'staff-agent',
}

const CACHE_PREFIX = 'ai_analysis_v2_'

function readAgentCache(agentId) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + agentId)
    if (!raw) return null
    const { analysis, date } = JSON.parse(raw)
    if (date !== new Date().toISOString().slice(0, 10)) return null
    return analysis
  } catch { return null }
}

const AGENT_DEFS = [
  { id: 'sales',     label: 'Savdo agenti',       Icon: TrendingUp, emptyLabel: 'Savdo tahlili' },
  { id: 'inventory', label: 'Tovar bazasi agenti', Icon: Package,    emptyLabel: 'Inventar tahlili' },
  { id: 'marketing', label: 'PR/Marketing agenti', Icon: Megaphone,  emptyLabel: 'Marketing tahlili' },
  { id: 'customer',  label: 'Mijoz muloqoti agenti',Icon: Users,     emptyLabel: 'Mijozlar tahlili' },
  { id: 'staff',     label: 'Xodimlar faoliyat agenti', Icon: UserCheck, emptyLabel: 'Xodimlar tahlili' },
]

function AgentCard({ def, onTabChange }) {
  const { id, label, Icon, emptyLabel } = def
  const color = TAB_COLORS[id]
  const cache = readAgentCache(AGENT_IDS[id])

  const topKpi    = cache?.kpis?.[0]
  const alertCount = cache?.alerts?.length ?? 0
  const topAlert   = cache?.alerts?.[0]
  const hasData    = !!topKpi

  const statusDot = !hasData
    ? 'bg-text-muted'
    : alertCount > 0 ? 'bg-amber-400' : 'bg-[#22c55e]'

  const statusText = !hasData
    ? 'Tahlil kutilmoqda'
    : alertCount > 0 ? 'Diqqat talab' : 'Faol'

  return (
    <button
      onClick={() => onTabChange(id)}
      className={`text-left p-4 rounded-xl border ${color.border} ${color.bg} hover:scale-[1.02] transition-all`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl ${color.bg} flex items-center justify-center border ${color.border}`}>
          <Icon size={16} className={color.text} />
        </div>
        {alertCount > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#E63946]/10 text-[#E63946] font-medium">
            {alertCount}
          </span>
        )}
      </div>

      {hasData ? (
        <>
          <p className={`text-xl font-bold font-syne ${color.text} leading-tight`}>{topKpi.value}</p>
          <p className="text-sm text-text-secondary mt-1 truncate">{topKpi.label}</p>
          {topAlert && (
            <p className="text-xs text-text-secondary mt-1.5 line-clamp-2 leading-snug opacity-80">
              {topAlert.message}
            </p>
          )}
        </>
      ) : (
        <>
          <p className={`text-xl font-bold font-syne ${color.text}`}>—</p>
          <p className="text-sm text-text-secondary mt-1">{emptyLabel}</p>
        </>
      )}

      <p className="text-sm text-text-primary mt-2 font-medium truncate">{label}</p>
      <div className="flex items-center gap-1 mt-1">
        <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
        <span className="text-xs text-text-secondary">{statusText}</span>
      </div>
    </button>
  )
}

function OverviewTab({ onTabChange }) {
  const { activities } = useAgentActivityStore()
  const { version } = useDataStore()

  // version ni o'qish — agentlar tahlildan keyin bump() chaqirganda qayta render bo'lsin
  void version
  void activities

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {AGENT_DEFS.map(def => (
          <AgentCard key={def.id} def={def} onTabChange={onTabChange} />
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
