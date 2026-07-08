import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Bell, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { TAB_COLORS, TYPE_COLORS, TYPE_LABEL_KEYS, AGENT_LABEL_KEYS, fmtTime } from '../aiHelpers'

const FEED_PAGE_SIZE = 5

function AgentActivityFeed({ agentId }) {
  const { t } = useTranslation()
  const { activities, getActivitiesByAgent, markAsRead, markAllAsRead, deleteActivity } = useAgentActivityStore()
  const [page, setPage] = useState(0)

  const list = agentId ? getActivitiesByAgent(agentId) : activities
  const totalPages = Math.max(1, Math.ceil(list.length / FEED_PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const shown = list.slice(safePage * FEED_PAGE_SIZE, (safePage + 1) * FEED_PAGE_SIZE)
  const unreadCount = list.filter(a => !a.read).length

  if (list.length === 0)
    return <p className="text-xs text-text-muted text-center py-6">{t('ai_feed_empty')}</p>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">
          {list.length} {t('ai_feed_messages')}{unreadCount > 0 ? ` · ${unreadCount} ${t('ai_feed_unread')}` : ''}
        </span>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-bg-secondary text-text-muted transition-colors flex items-center gap-1"
          >
            <CheckCircle size={11} /> {t('ai_mark_all_read')}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {shown.map(a => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex gap-2 p-3 rounded-xl border transition-colors ${a.read ? 'border-border/50 opacity-60' : 'border-border bg-bg-secondary'}`}
          >
            {!a.read && (
              <Bell size={12} className={`flex-shrink-0 mt-1 ${
                a.type === 'ALERT' ? 'text-[#E63946]' :
                a.type === 'RECOMMENDATION' ? 'text-[#22c55e]' :
                a.type === 'BOOKING' ? 'text-purple-400' :
                a.type === 'NOTE' ? 'text-[#f97316]' : 'text-[#3b82f6]'
              }`} />
            )}
            <div className={`flex-shrink-0 h-fit mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[a.type] || 'text-text-muted bg-bg-secondary'}`}>
              {t(TYPE_LABEL_KEYS[a.type]) || a.type}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-snug ${a.read ? 'text-text-muted' : 'text-text-primary'}`}>{a.messageKey ? t(a.messageKey) : a.message}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-text-muted">{fmtTime(a.timestamp, t)}</span>
                {!agentId && a.agentId && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${TAB_COLORS[a.agentId]?.bg || ''} ${TAB_COLORS[a.agentId]?.text || ''}`}>
                    {t(AGENT_LABEL_KEYS[a.agentId])}
                  </span>
                )}
                {a.relatedAgentId && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${TAB_COLORS[a.relatedAgentId]?.bg || ''} ${TAB_COLORS[a.relatedAgentId]?.text || ''}`}>
                    → {t(AGENT_LABEL_KEYS[a.relatedAgentId])}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 flex items-start gap-0.5">
              {!a.read && (
                <button onClick={() => markAsRead(a.id)} title={t('ai_mark_all_read')} className="p-1 rounded hover:bg-bg-primary text-text-muted hover:text-[#22c55e] transition-colors">
                  <CheckCircle size={13} />
                </button>
              )}
              <button onClick={() => deleteActivity(a.id)} title={t('delete')} className="p-1 rounded hover:bg-bg-primary text-text-muted hover:text-[#E63946] transition-colors">
                <X size={13} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage === 0} className="text-xs px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-bg-secondary text-text-muted transition-colors">
            {t('ai_prev')}
          </button>
          <span className="text-xs text-text-muted">{safePage + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1} className="text-xs px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-bg-secondary text-text-muted transition-colors">
            {t('ai_next')}
          </button>
        </div>
      )}
    </div>
  )
}

export default AgentActivityFeed
