import { useState, useEffect } from 'react'
import { Bot, TrendingUp, Package, Megaphone, MessageSquare, UserCheck, Save, ChevronDown, ChevronUp, Zap, ToggleLeft, ToggleRight, Info, Clock, Trash2 } from 'lucide-react'
import { getAiAgents, updateAiAgent, getAvailableTools } from '../../../api/aiAgentsService'
import { useSettingsStore } from '../../../store/settingsStore'
import { clearAllAnalysisCache } from '../../AIAgent/hooks/useAgentAnalysis'

const AGENT_ICONS = {
  'sales-agent':    { Icon: TrendingUp,   color: 'text-accent-green',  bg: 'bg-accent-green/10',  border: 'border-accent-green/30' },
  'product-agent':  { Icon: Package,      color: 'text-accent-red',    bg: 'bg-accent-red/10',    border: 'border-accent-red/30' },
  'pr-agent':       { Icon: Megaphone,    color: 'text-accent-orange', bg: 'bg-accent-orange/10', border: 'border-accent-orange/30' },
  'customer-agent': { Icon: MessageSquare,color: 'text-accent-blue',   bg: 'bg-accent-blue/10',   border: 'border-accent-blue/30' },
  'staff-agent':    { Icon: UserCheck,    color: 'text-purple-400',    bg: 'bg-purple-400/10',    border: 'border-purple-400/30' },
}

const MODELS = [
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 — Tez, arzon' },
  { value: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6 — Yaxshi til sifati ⭐' },
  { value: 'claude-sonnet-5',           label: 'Claude Sonnet 5 — Eng yangi' },
  { value: 'claude-opus-4-8',           label: 'Claude Opus 4.8 — Eng kuchli, qimmat' },
]

const TOOL_LABELS = {
  get_sales_summary:    'Savdo statistikasi',
  get_low_stock:        'Kam zaxirali tovarlar',
  get_customer_debts:   'Nasiyador mijozlar',
  get_top_products:     'Eng ko\'p sotilgan tovarlar',
  get_profit_by_brand:  'Brend bo\'yicha foyda',
  get_recent_returns:   'So\'nggi bekor sotuvlar',
  get_supplier_debts:   'Yetkazib beruvchilar qarzi',
  get_expenses_summary: 'Xarajatlar xulosasi',
  get_capital_summary:  'Jalb qilingan mablag\'lar',
}

const INTEGRATION_CONFIG = {
  'pr-agent': [
    { key: 'higgsfield.apiKey',  label: 'Higgsfield API kalit',   type: 'password', placeholder: 'hf-...' },
    { key: 'higgsfield.enabled', label: 'Higgsfield yoqilgan',    type: 'toggle' },
    { key: 'instagram.enabled',  label: 'Instagram post yoqilgan', type: 'toggle' },
  ],
  'customer-agent': [
    { key: 'telegram.botToken',  label: 'Telegram Bot Token',     type: 'password', placeholder: '123456:ABC...' },
    { key: 'telegram.enabled',   label: 'Telegram xabarlar yoqilgan', type: 'toggle' },
    { key: 'makeWebhook.url',    label: 'make.com Webhook URL',   type: 'text',     placeholder: 'https://hook.make.com/...' },
    { key: 'makeWebhook.enabled',label: 'Instagram DM yoqilgan',  type: 'toggle' },
  ],
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => (o || {})[k], obj)
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.')
  const result = { ...obj }
  let cur = result
  for (let i = 0; i < keys.length - 1; i++) {
    cur[keys[i]] = { ...(cur[keys[i]] || {}) }
    cur = cur[keys[i]]
  }
  cur[keys[keys.length - 1]] = value
  return result
}

function AgentCard({ agent, availableTools, onSave }) {
  const [form, setForm] = useState({
    systemPrompt: agent.systemPrompt || '',
    knowledge:    agent.knowledge || '',
    model:        agent.model || 'claude-haiku-4-5-20251001',
    temperature:  agent.temperature ?? 0.7,
    maxTokens:    agent.maxTokens || 1024,
    tools:        agent.tools || [],
    integrations: agent.integrations || {},
    isActive:     agent.isActive,
  })
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { Icon, color, bg, border } = AGENT_ICONS[agent.slug] || { Icon: Bot, color: 'text-text-muted', bg: 'bg-bg-secondary', border: 'border-border' }
  const integrations = INTEGRATION_CONFIG[agent.slug] || []

  const toggleTool = (tool) => {
    setForm(f => ({
      ...f,
      tools: f.tools.includes(tool) ? f.tools.filter(t => t !== tool) : [...f.tools, tool],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave(agent.id, {
      system_prompt: form.systemPrompt,
      knowledge:     form.knowledge,
      model:         form.model,
      temperature:   form.temperature,
      max_tokens:    form.maxTokens,
      tools:         form.tools,
      integrations:  form.integrations,
      is_active:     form.isActive,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className={`rounded-xl border ${border} bg-bg-primary overflow-hidden`}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-bg-secondary/50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center flex-shrink-0`}>
            <Icon size={17} className={color} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{agent.name}</p>
            <p className="text-xs text-text-muted">{agent.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Active toggle */}
          <button
            onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, isActive: !f.isActive })) }}
            className="flex items-center gap-1.5"
          >
            {form.isActive
              ? <ToggleRight size={22} className="text-accent-green" />
              : <ToggleLeft size={22} className="text-text-muted" />}
            <span className={`text-xs ${form.isActive ? 'text-accent-green' : 'text-text-muted'}`}>
              {form.isActive ? 'Yoniq' : 'O\'chiq'}
            </span>
          </button>
          {expanded ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border">
          {/* System Prompt */}
          <div className="pt-4">
            <label className="text-xs font-medium text-text-secondary mb-1.5 flex items-center gap-1.5">
              <Bot size={12} /> System Prompt
            </label>
            <textarea
              value={form.systemPrompt}
              onChange={e => setForm(f => ({ ...f, systemPrompt: e.target.value }))}
              rows={7}
              className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-text-primary font-mono focus:outline-none focus:border-accent-green/50 resize-y"
              placeholder="Agent roli, vazifasi va chegaralarini yozing..."
            />
          </div>

          {/* Knowledge Base */}
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 flex items-center gap-1.5">
              <Info size={12} /> Knowledge Base
              <span className="text-text-muted font-normal">(manzil, ish vaqti, narxlar, qoidalar)</span>
            </label>
            <textarea
              value={form.knowledge}
              onChange={e => setForm(f => ({ ...f, knowledge: e.target.value }))}
              rows={5}
              className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-text-primary font-mono focus:outline-none focus:border-accent-green/50 resize-y"
              placeholder="Do'kon haqida statik ma'lumotlar: manzil, ish vaqti, narxlar, qoidalar..."
            />
          </div>

          {/* Model sozlamalari */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Model</label>
              <select
                value={form.model}
                onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                className="w-full bg-bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none"
              >
                {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                Harorat (Temperature): <span className="text-accent-green">{form.temperature}</span>
              </label>
              <input
                type="range" min="0" max="1" step="0.1"
                value={form.temperature}
                onChange={e => setForm(f => ({ ...f, temperature: Number(e.target.value) }))}
                className="w-full accent-accent-green"
              />
              <div className="flex justify-between text-[10px] text-text-muted mt-0.5">
                <span>Aniq</span><span>Ijodiy</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Max tokens</label>
              <input
                type="number" min="256" max="4096" step="256"
                value={form.maxTokens}
                onChange={e => setForm(f => ({ ...f, maxTokens: Number(e.target.value) }))}
                className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Tools */}
          {availableTools.length > 0 && (
            <div>
              <label className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1.5">
                <Zap size={12} /> CRM Tools (agent ishlatishi mumkin bo'lgan ma'lumotlar)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableTools.map(tool => (
                  <button
                    key={tool}
                    onClick={() => toggleTool(tool)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-colors text-left ${
                      form.tools.includes(tool)
                        ? `${bg} ${border} ${color} font-medium`
                        : 'border-border text-text-muted hover:bg-bg-secondary'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                      form.tools.includes(tool) ? `${color} border-current` : 'border-border'
                    }`}>
                      {form.tools.includes(tool) && <div className="w-2 h-2 rounded-sm bg-current" />}
                    </div>
                    {TOOL_LABELS[tool] || tool}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Integratsiyalar */}
          {integrations.length > 0 && (
            <div>
              <label className="text-xs font-medium text-text-secondary mb-2 block">Integratsiyalar</label>
              <div className="space-y-2 p-3 bg-bg-secondary rounded-lg border border-border">
                {integrations.map(cfg => (
                  <div key={cfg.key} className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary w-44 flex-shrink-0">{cfg.label}</span>
                    {cfg.type === 'toggle' ? (
                      <button
                        onClick={() => setForm(f => ({
                          ...f,
                          integrations: setNestedValue(f.integrations, cfg.key, !getNestedValue(f.integrations, cfg.key))
                        }))}
                      >
                        {getNestedValue(form.integrations, cfg.key)
                          ? <ToggleRight size={20} className="text-accent-green" />
                          : <ToggleLeft size={20} className="text-text-muted" />}
                      </button>
                    ) : (
                      <input
                        type={cfg.type === 'password' ? 'password' : 'text'}
                        value={getNestedValue(form.integrations, cfg.key) || ''}
                        onChange={e => setForm(f => ({
                          ...f,
                          integrations: setNestedValue(f.integrations, cfg.key, e.target.value)
                        }))}
                        placeholder={cfg.placeholder}
                        className="flex-1 bg-bg-primary border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent-green/50"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              saved
                ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
                : 'bg-accent-green text-white hover:bg-accent-green/90'
            } disabled:opacity-50`}
          >
            <Save size={14} />
            {saving ? 'Saqlanmoqda...' : saved ? 'Saqlandi ✓' : 'Saqlash'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function AiAgentsTab() {
  const [agents, setAgents] = useState([])
  const [availableTools, setAvailableTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cacheCleared, setCacheCleared] = useState(false)
  const { aiAutoAnalysisHour, setAiAutoAnalysisHour } = useSettingsStore()

  const handleClearCache = () => {
    clearAllAnalysisCache()
    setCacheCleared(true)
    setTimeout(() => setCacheCleared(false), 2000)
  }

  useEffect(() => {
    Promise.all([getAiAgents(), getAvailableTools()])
      .then(([a, t]) => { setAgents(a); setAvailableTools(t) })
      .catch(e => setError(e?.response?.data?.error || e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (id, payload) => {
    const updated = await updateAiAgent(id, payload)
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a))
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="p-6 text-center">
      <p className="text-sm text-accent-red mb-1">Backend bilan ulanishda xato</p>
      <p className="text-xs text-text-muted">{error}</p>
    </div>
  )

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-2 mb-2">
        <Bot size={16} className="text-accent-green" />
        <h2 className="text-sm font-semibold text-text-primary">AI Agentlar sozlamalari</h2>
        <span className="text-xs text-text-muted">— har bir agentni alohida sozlang</span>
      </div>

      {/* Kunlik tahlil vaqti */}
      <div className="bg-bg-secondary border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Clock size={14} className="text-amber-400" />
          <div>
            <p className="text-sm font-medium text-text-primary">Kunlik avtomatik tahlil vaqti</p>
            <p className="text-xs text-text-muted mt-0.5">AI agentlar har kuni shu vaqtda ma'lumotlarni tahlil qiladi. Kesh yangilanadi.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={aiAutoAnalysisHour}
            onChange={e => setAiAutoAnalysisHour(e.target.value)}
            className="bg-bg-primary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-amber-400/50"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
            ))}
          </select>
          <button
            onClick={handleClearCache}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
              cacheCleared
                ? 'border-accent-green/30 bg-accent-green/10 text-accent-green'
                : 'border-border text-text-muted hover:text-accent-red hover:border-accent-red/30'
            }`}
          >
            <Trash2 size={12} />
            {cacheCleared ? 'Tozalandi ✓' : 'Keshni tozalash'}
          </button>
        </div>
      </div>
      {agents.map(agent => (
        <AgentCard
          key={agent.id}
          agent={agent}
          availableTools={availableTools}
          onSave={handleSave}
        />
      ))}
    </div>
  )
}
