import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Map, CheckCircle2, Plus, X } from 'lucide-react'
import { useMarketingStore } from '../../../store/marketingStore'

const PHASES = [
  { phase: '1oy', color: 'text-[#22c55e]', border: 'border-[#22c55e]/30', bg: 'bg-[#22c55e]/5' },
  { phase: '3oy', color: 'text-[#f97316]', border: 'border-[#f97316]/30', bg: 'bg-[#f97316]/5' },
  { phase: '6oy', color: 'text-accent-blue', border: 'border-accent-blue/30', bg: 'bg-accent-blue/5' },
]

// Marketing yo'l xaritasi: qo'lda yoki AI tavsiyalaridan 1/3/6 oylik rejalar (brauzerda saqlanadi)
export default function MarketingRoadmap({ recommendations = [] }) {
  const { t } = useTranslation()
  const { roadmapItems, addRoadmapItem, toggleRoadmapItem, deleteRoadmapItem } = useMarketingStore()
  const [input, setInput] = useState({ '1oy': '', '3oy': '', '6oy': '' })

  const add = (phase) => {
    const v = input[phase].trim()
    if (!v) return
    addRoadmapItem(phase, v)
    setInput(prev => ({ ...prev, [phase]: '' }))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Map size={15} className="text-[#f97316]" />
        <p className="text-sm font-semibold text-text-primary">{t('aisec_roadmap')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PHASES.map(({ phase, color, border, bg }) => {
          const items = roadmapItems.filter(r => r.phase === phase)
          const done = items.filter(r => r.done).length
          return (
            <div key={phase} className={`rounded-xl border ${border} ${bg} p-3 space-y-2`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${color}`}>{t(`aisec_phase_${phase}`)}</span>
                {items.length > 0 && <span className="text-xs text-text-muted">{done}/{items.length}</span>}
              </div>
              {items.map(r => (
                <div key={r.id} className="flex items-start gap-2 group">
                  <button onClick={() => toggleRoadmapItem(r.id)} className={`mt-0.5 flex-shrink-0 ${r.done ? color : 'text-text-muted'}`}>
                    <CheckCircle2 size={15} />
                  </button>
                  <span className={`text-xs flex-1 leading-snug ${r.done ? 'text-text-muted' : 'text-text-primary'}`}>{r.text}</span>
                  <button onClick={() => deleteRoadmapItem(r.id)} className="hover-reveal text-text-muted hover:text-accent-red flex-shrink-0">
                    <X size={13} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input value={input[phase]} onChange={e => setInput(prev => ({ ...prev, [phase]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') add(phase) }} placeholder={t('aisec_roadmap_add')}
                  className="flex-1 min-w-0 bg-bg-primary border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none" />
                <button onClick={() => add(phase)} className={`px-2 py-1.5 rounded-lg text-xs ${color} border ${border}`}><Plus size={13} /></button>
              </div>
            </div>
          )
        })}
      </div>
      {recommendations.length > 0 && (
        <div className="p-3 border border-[#f97316]/20 rounded-xl bg-[#f97316]/5 space-y-2">
          <p className="text-xs text-[#f97316] font-medium">{t('aisec_roadmap_from_ai')}</p>
          {recommendations.map((rec, i) => (
            <div key={i} className="flex flex-wrap items-start gap-2">
              <span className="text-xs text-text-secondary flex-1 min-w-[12rem]"><b className="text-text-primary">{rec.title}</b> — {rec.text}</span>
              <div className="flex gap-1 flex-shrink-0">
                {['1oy', '3oy', '6oy'].map(ph => (
                  <button key={ph} onClick={() => addRoadmapItem(ph, `${rec.title}: ${rec.text}`)}
                    className="text-xs px-2 py-0.5 rounded border border-border text-text-muted hover:bg-bg-secondary">+{t(`aisec_phase_${ph}`)}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
