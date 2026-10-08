import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Bot, Sparkles, Clock, Lock, ChevronDown, ChevronUp, Save, ToggleLeft, ToggleRight, RotateCcw, Play, Loader2, Zap, BookOpen } from 'lucide-react'
import { getAssistantTools, getAiSchedule, saveAiSchedule } from '../../../api/aiAgentsService'
import { getAiDigestStatus, runAiDigests } from '../../../api/aiStatsService'
import { useShopStore } from '../../../store/shopStore'

const MODELS = [
  { value: 'claude-sonnet-5-5', key: 'aiadm_model_sonnet' },
  { value: 'claude-opus-5-5', key: 'aiadm_model_opus' },
  { value: 'claude-haiku-4-5-20251001', key: 'aiadm_model_haiku' },
]
const SECTIONS = ['sales', 'inventory', 'customers', 'marketing', 'staff', 'wholesale', 'production']
const SHOP_KIND_SECTIONS = { wholesale: 'wholesale', production: 'production' }
const pad = (n) => String(n).padStart(2, '0')
const fmtDT = (iso) => { const d = new Date(iso); return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}` }

export const Toggle = ({ on, onClick, t }) => (
  <button type="button" onClick={onClick} className="flex items-center gap-1.5">
    {on ? <ToggleRight size={22} className="text-accent-green" /> : <ToggleLeft size={22} className="text-text-muted" />}
    <span className={`text-xs ${on ? 'text-accent-green' : 'text-text-muted'}`}>{on ? t('aiadm_on') : t('aiadm_off')}</span>
  </button>
)

// Koddagi asosiy qoidalar — faqat ko'rish uchun
export const BaseRules = ({ text, t }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-border bg-bg-secondary">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left">
        <span className="flex items-center gap-1.5 text-xs font-medium text-text-secondary"><Lock size={12} /> {t('aiadm_base_rules')}</span>
        {open ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
      </button>
      {open && (
        <div className="px-3 pb-3">
          <p className="text-[11px] text-text-muted mb-2">{t('aiadm_base_rules_hint')}</p>
          <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-text-secondary font-mono max-h-72 overflow-y-auto">{text}</pre>
        </div>
      )}
    </div>
  )
}

export const Field = ({ label, icon: Icon, hint, value, onChange, rows = 4, placeholder }) => (
  <div>
    <label className="text-xs font-medium text-text-secondary mb-1 flex items-center gap-1.5">{Icon && <Icon size={12} />} {label}</label>
    {hint && <p className="text-[11px] text-text-muted mb-1.5">{hint}</p>}
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
      className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-green/50 resize-y" />
  </div>
)

const ModelSelect = ({ value, onChange, t }) => (
  <div>
    <label className="text-xs font-medium text-text-secondary mb-1 block">{t('aiadm_model')}</label>
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full sm:w-auto bg-bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none">
      {MODELS.map(m => <option key={m.value} value={m.value}>{t(m.key)}</option>)}
    </select>
  </div>
)

export const SaveBar = ({ saving, saved, onSave, onReset, t }) => (
  <div className="flex flex-wrap gap-2">
    <button onClick={onSave} disabled={saving}
      className={`flex-1 min-w-[10rem] py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${saved ? 'bg-accent-green/20 text-accent-green border border-accent-green/30' : 'bg-accent-green text-white hover:bg-accent-green/90'} disabled:opacity-50`}>
      <Save size={14} /> {saving ? t('aiadm_saving') : saved ? t('aiadm_saved') : t('aiadm_save')}
    </button>
    {onReset && (
      <button onClick={onReset} className="px-3 py-2.5 rounded-xl text-xs border border-border text-text-muted hover:text-text-primary flex items-center gap-1.5">
        <RotateCcw size={13} /> {t('aiadm_reset')}
      </button>
    )}
  </div>
)

export const useSaver = (onSave) => {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const save = async (id, payload) => {
    setSaving(true)
    try {
      await onSave(id, payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { /* xato ota komponentda ko'rsatiladi */ } finally { setSaving(false) }
  }
  return { saving, saved, save }
}

export const CardShell = ({ icon: Icon, color, title, desc, isActive, onToggle, children, t }) => {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-xl border border-border bg-bg-primary overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-bg-secondary/50" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl ${color.bg} flex items-center justify-center flex-shrink-0`}><Icon size={17} className={color.text} /></div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary">{title}</p>
            <p className="text-xs text-text-muted">{desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <Toggle on={isActive} onClick={onToggle} t={t} />
          <button onClick={() => setExpanded(e => !e)}>{expanded ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}</button>
        </div>
      </div>
      {expanded && <div className="px-4 pb-4 pt-3 space-y-4 border-t border-border">{children}</div>}
    </div>
  )
}

// ─── AI yordamchi ─────────────────────────────────────────────────────────
export function AssistantCard({ agent, onSave }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    isActive: agent.isActive, model: agent.model, customInstructions: agent.customInstructions,
    knowledge: agent.knowledge || '', tools: agent.tools || [],
  })
  const [catalog, setCatalog] = useState([])
  const { saving, saved, save } = useSaver(onSave)
  useEffect(() => { getAssistantTools().then(setCatalog).catch(() => {}) }, [])

  const toggleTool = (name) => setForm(f => ({ ...f, tools: f.tools.includes(name) ? f.tools.filter(x => x !== name) : [...f.tools, name] }))
  const submit = () => save(agent.id, { is_active: form.isActive, model: form.model, custom_instructions: form.customInstructions, knowledge: form.knowledge, tools: form.tools })

  return (
    <CardShell icon={Bot} color={{ bg: 'bg-accent-blue/10', text: 'text-accent-blue' }} title={t('aiadm_assistant')} desc={t('aiadm_assistant_desc')}
      isActive={form.isActive} onToggle={() => setForm(f => ({ ...f, isActive: !f.isActive }))} t={t}>
      <ModelSelect value={form.model} onChange={v => setForm(f => ({ ...f, model: v }))} t={t} />
      <BaseRules text={agent.basePrompt} t={t} />
      <Field label={t('aiadm_custom')} hint={t('aiadm_custom_hint')} value={form.customInstructions} rows={5}
        placeholder={t('aiadm_custom_ph_assistant')} onChange={v => setForm(f => ({ ...f, customInstructions: v }))} />
      <Field label={t('aiadm_knowledge')} icon={BookOpen} hint={t('aiadm_knowledge_hint')} value={form.knowledge} rows={4}
        placeholder={t('aiadm_knowledge_ph')} onChange={v => setForm(f => ({ ...f, knowledge: v }))} />
      {catalog.length > 0 && (
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1 flex items-center gap-1.5"><Zap size={12} /> {t('aiadm_tools')}</label>
          <p className="text-[11px] text-text-muted mb-2">{t('aiadm_tools_hint')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 max-h-80 overflow-y-auto pr-1">
            {catalog.map(tool => {
              const on = form.tools.includes(tool.name)
              return (
                <button key={tool.name} type="button" onClick={() => toggleTool(tool.name)} title={tool.description}
                  className={`flex items-start gap-2 px-2.5 py-2 rounded-lg border text-left ${on ? 'border-accent-blue/40 bg-accent-blue/5' : 'border-border hover:bg-bg-secondary'}`}>
                  <span className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${on ? 'border-accent-blue text-accent-blue' : 'border-border'}`}>
                    {on && <span className="w-2 h-2 rounded-sm bg-current" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-text-primary">{t(`aitool_${tool.name}`, { defaultValue: tool.name })}</span>
                    <span className="block text-[11px] text-text-muted line-clamp-2">{tool.description}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
      <SaveBar saving={saving} saved={saved} onSave={submit} t={t}
        onReset={() => setForm(f => ({ ...f, customInstructions: '', tools: catalog.map(x => x.name) }))} />
    </CardShell>
  )
}

// ─── Kundalik tahlilchi ───────────────────────────────────────────────────
export function AnalystCard({ agent, onSave }) {
  const { t } = useTranslation()
  const initSections = () => Object.fromEntries(SECTIONS.map(s => [s, {
    enabled: agent.sectionInstructions?.[s]?.enabled !== false,
    text: agent.sectionInstructions?.[s]?.text || '',
  }]))
  const [form, setForm] = useState({
    isActive: agent.isActive, model: agent.model, customInstructions: agent.customInstructions,
    knowledge: agent.knowledge || '', sections: initSections(),
  })
  const [activeSec, setActiveSec] = useState('sales')
  const shops = useShopStore(st => st.shops)
  const visibleSections = SECTIONS.filter(x => !SHOP_KIND_SECTIONS[x] || shops.some(sh => sh.kind === SHOP_KIND_SECTIONS[x] && sh.isActive))
  const [status, setStatus] = useState(null)
  const [running, setRunning] = useState(false)
  const { saving, saved, save } = useSaver(onSave)

  const loadStatus = () => getAiDigestStatus().then(s => { setStatus(s); setRunning(!!s.running) }).catch(() => {})
  useEffect(() => { loadStatus() }, [])
  useEffect(() => {
    if (!running) return
    const id = setInterval(loadStatus, 4000)
    return () => clearInterval(id)
  }, [running])

  const setSec = (s, patch) => setForm(f => ({ ...f, sections: { ...f.sections, [s]: { ...f.sections[s], ...patch } } }))
  const submit = () => save(agent.id, {
    is_active: form.isActive, model: form.model, custom_instructions: form.customInstructions,
    knowledge: form.knowledge, section_instructions: form.sections,
  })
  const runNow = async () => {
    setRunning(true)
    try { await runAiDigests() } catch { /* 409 — allaqachon ishlayapti */ }
    loadStatus()
  }
  const last = status?.last
  const sec = form.sections[activeSec]

  return (
    <CardShell icon={Sparkles} color={{ bg: 'bg-purple-500/10', text: 'text-purple-400' }} title={t('aiadm_analyst')} desc={t('aiadm_analyst_desc')}
      isActive={form.isActive} onToggle={() => setForm(f => ({ ...f, isActive: !f.isActive }))} t={t}>
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-bg-secondary border border-border">
        <div className="text-xs text-text-secondary">
          {last ? t('aiadm_last_run', {
            date: fmtDT(last.started_at),
            status: t(`aiadm_status_${last.status}`, { defaultValue: last.status }),
            tokens: ((last.tokens_in || 0) + (last.tokens_out || 0)).toLocaleString('uz-UZ'),
          }) : t('aiadm_never_run')}
        </div>
        <button onClick={runNow} disabled={running}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-accent-blue/30 text-accent-blue hover:bg-accent-blue/10 disabled:opacity-50">
          {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />} {running ? t('aisec_digest_running') : t('aisec_digest_run_all')}
        </button>
      </div>
      <ModelSelect value={form.model} onChange={v => setForm(f => ({ ...f, model: v }))} t={t} />
      <BaseRules text={agent.basePrompt} t={t} />
      <Field label={t('aiadm_custom_all')} hint={t('aiadm_custom_hint')} value={form.customInstructions} rows={4}
        placeholder={t('aiadm_custom_ph_analyst')} onChange={v => setForm(f => ({ ...f, customInstructions: v }))} />

      <div className="space-y-2">
        <p className="text-xs font-medium text-text-secondary">{t('aiadm_sections')}</p>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {visibleSections.map(s => (
            <button key={s} type="button" onClick={() => setActiveSec(s)}
              className={`px-3 py-1.5 rounded-lg text-xs border flex-shrink-0 ${activeSec === s ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'border-border text-text-muted hover:bg-bg-secondary'} ${form.sections[s].enabled ? '' : 'line-through opacity-60'}`}>
              {t(`aisec_head_${s}`)}
            </button>
          ))}
        </div>
        <div className="p-3 rounded-lg border border-border space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-text-secondary">{t('aiadm_section_enabled')}</span>
            <Toggle on={sec.enabled} onClick={() => setSec(activeSec, { enabled: !sec.enabled })} t={t} />
          </div>
          <div className="rounded-lg bg-bg-secondary p-2.5">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-text-muted mb-1"><Lock size={11} /> {t('aiadm_section_focus')}</p>
            <p className="text-[11px] text-text-secondary whitespace-pre-wrap leading-relaxed">{agent.sectionPrompts?.[activeSec]}</p>
          </div>
          <Field label={t('aiadm_section_custom', { name: t(`aisec_head_${activeSec}`) })} value={sec.text} rows={3}
            placeholder={t(`aiadm_section_ph_${activeSec}`)} onChange={v => setSec(activeSec, { text: v })} />
        </div>
      </div>

      <Field label={t('aiadm_knowledge')} icon={BookOpen} hint={t('aiadm_knowledge_hint_analyst')} value={form.knowledge} rows={3}
        placeholder={t('aiadm_knowledge_ph')} onChange={v => setForm(f => ({ ...f, knowledge: v }))} />
      <SaveBar saving={saving} saved={saved} onSave={submit} t={t}
        onReset={() => setForm(f => ({ ...f, customInstructions: '', sections: Object.fromEntries(SECTIONS.map(s => [s, { enabled: true, text: '' }])) }))} />
    </CardShell>
  )
}

// ─── Jadval ───────────────────────────────────────────────────────────────
export function ScheduleCard() {
  const { t } = useTranslation()
  const [hour, setHour] = useState(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  useEffect(() => { getAiSchedule().then(s => setHour(s.hour)).catch(() => setHour(7)) }, [])

  const change = async (h) => {
    setHour(h)
    setError(null)
    try {
      await saveAiSchedule(h)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) { setError(err?.response?.data?.error || err.message) }
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-start gap-2 flex-1">
        <Clock size={14} className="text-amber-400 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-text-primary">{t('aiadm_schedule')}</p>
          <p className="text-xs text-text-muted mt-0.5">{t('aiadm_schedule_hint')}</p>
          {error && <p className="text-xs text-accent-red mt-1">{error}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {hour !== null && (
          <select value={hour} onChange={e => change(Number(e.target.value))}
            className="bg-bg-primary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none">
            {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>)}
          </select>
        )}
        {saved && <span className="text-xs text-accent-green">{t('aiadm_saved')}</span>}
      </div>
    </div>
  )
}
