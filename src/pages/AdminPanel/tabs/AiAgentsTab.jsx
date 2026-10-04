import { useState, useEffect } from 'react'
import { Bot, TrendingUp, Package, Megaphone, MessageSquare, MessageCircle, UserCheck, Globe, Send, Save, ChevronDown, ChevronUp, Zap, ToggleLeft, ToggleRight, Info, Clock, Trash2 } from 'lucide-react'
import { getAiAgents, updateAiAgent } from '../../../api/aiAgentsService'
import { useSettingsStore } from '../../../store/settingsStore'
import { clearAnalysisCache, clearAllAnalysisCache } from '../../AIAgent/hooks/useAgentAnalysis'

const AGENT_ICONS = {
  'sales-agent':        { Icon: TrendingUp,    color: 'text-accent-green',  bg: 'bg-accent-green/10',  border: 'border-border' },
  'product-agent':      { Icon: Package,       color: 'text-accent-red',    bg: 'bg-accent-red/10',    border: 'border-border' },
  'pr-agent':           { Icon: Megaphone,     color: 'text-accent-orange', bg: 'bg-accent-orange/10', border: 'border-border' },
  'customer-agent':     { Icon: MessageSquare, color: 'text-accent-blue',   bg: 'bg-accent-blue/10',   border: 'border-border' },
  'staff-agent':        { Icon: UserCheck,     color: 'text-purple-400',    bg: 'bg-purple-400/10',    border: 'border-border' },
  'instagram-agent':    { Icon: Globe,         color: 'text-pink-400',      bg: 'bg-pink-400/10',      border: 'border-border' },
  'instagram-dm-agent': { Icon: MessageCircle, color: 'text-pink-400',      bg: 'bg-pink-400/10',      border: 'border-border' },
  'telegram-agent':     { Icon: Send,          color: 'text-blue-400',      bg: 'bg-blue-400/10',      border: 'border-border' },
}

const MODELS = [
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 — Tez, arzon' },
  { value: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6 — Yaxshi til sifati ⭐' },
  { value: 'claude-sonnet-5',           label: 'Claude Sonnet 5 — Eng yangi' },
  { value: 'claude-opus-4-8',           label: 'Claude Opus 4.8 — Eng kuchli, qimmat' },
]

const TOOL_LABELS = {
  // Savdo agenti
  get_sales_summary:         'Savdo statistikasi',
  get_profit_by_brand:       'Brend bo\'yicha foyda',
  get_recent_returns:        'So\'nggi bekor sotuvlar',
  get_supplier_debts:        'Yetkazib beruvchilar qarzi',
  get_expenses_summary:      'Xarajatlar xulosasi',
  get_capital_summary:       'Jalb qilingan mablag\'lar',
  get_discounts_summary:     'Chegirmalar va aksiyalar xulosasi',
  // Ombor agenti
  get_low_stock:             'Kam zaxirali tovarlar',
  get_top_products:          'Eng ko\'p sotilgan tovarlar',
  get_barcodes_summary:      'Barkodlar holati',
  // Mijozlar agenti
  get_top_customers:           'Eng yaxshi mijozlar (xarid soni, sarflagan pul)',
  get_inactive_customers:      'Uzoqlashayotgan mijozlar (qayta jalb)',
  get_customer_segments:       'Segmentatsiya (yangi/sodiq/xavf ostida/uyqudagi)',
  get_customer_debts:          'Nasiyadorlar (qarz holati)',
  search_products:             'Tovar qidirish (savollarga javob)',
  create_reservation:          'Tovar bron qilish',
  // Instagram agenti
  get_customer_by_instagram:        'Instagram mijozni aniqlash',
  get_customer_purchase_history:    'Mijoz xarid tarixi',
  // Xodimlar agenti
  get_staff_performance:     'Xodim samaradorligi (sotuv, tushum, foyda)',
  get_staff_discount_report: 'Xodim chegirma hisoboti (kim, kimga, necha marta)',
  get_staff_violations:      'Qoida buzilishlari (narx, bekor sotuv)',
  get_salary_info:           'Maosh va rol ma\'lumoti',
  get_monthly_growth:        'Oy-oy sotuv o\'sishi',
}

// Har agent uchun qaysi toollar ko'rinishi kerak
const AGENT_TOOLS = {
  'sales-agent':        ['get_sales_summary', 'get_customer_debts', 'get_profit_by_brand', 'get_recent_returns', 'get_supplier_debts', 'get_expenses_summary', 'get_capital_summary', 'get_discounts_summary'],
  'product-agent':      ['get_low_stock', 'get_top_products', 'get_barcodes_summary'],
  'pr-agent':           ['get_sales_summary', 'get_top_products', 'get_low_stock', 'get_discounts_summary', 'get_customer_debts', 'get_recent_returns', 'get_profit_by_brand', 'get_monthly_growth'],
  'customer-agent':     ['get_top_customers', 'get_inactive_customers', 'get_customer_segments', 'get_customer_debts', 'get_recent_returns', 'get_discounts_summary', 'get_sales_summary', 'search_products', 'create_reservation'],
  'staff-agent':        ['get_sales_summary', 'get_discounts_summary', 'get_staff_performance', 'get_staff_discount_report', 'get_staff_violations', 'get_salary_info', 'get_monthly_growth'],
  'instagram-agent':    ['search_products', 'create_reservation'],
  'instagram-dm-agent': ['get_customer_by_instagram', 'get_customer_purchase_history', 'search_products', 'create_reservation', 'get_discounts_summary'],
  'telegram-agent':     [],
}

const INTEGRATION_CONFIG = {
  'instagram-agent': [
    { key: 'instagram.handle',        label: 'Instagram akkaunt',                 type: 'text',     placeholder: '@goodtires_uz' },
    { key: 'instagram.accessToken',   label: 'Instagram Access Token',            type: 'password', placeholder: 'EAAB...' },
    { key: 'instagram.pageId',        label: 'Instagram Business Account ID',     type: 'text',     placeholder: '27509075055455614' },
    { key: 'instagram.userId',        label: 'Instagram User ID (o\'z akkaunti)', type: 'text',     placeholder: '17841437993304690' },
    { key: 'instagram.webhookSecret', label: 'Webhook Secret (ixtiyoriy)',         type: 'password', placeholder: 'mysecret' },
    { key: 'anthropic.apiKey',        label: 'Anthropic API kaliti (ixtiyoriy)',  type: 'password', placeholder: 'sk-ant-...' },
    { key: 'instagram.enabled',       label: 'Instagram komment bot',    type: 'toggle' },
  ],
  'instagram-dm-agent': [
    { key: 'instagram.dmEnabled', label: 'Instagram DM bot', type: 'toggle' },
  ],
  'telegram-agent': [
    { key: 'telegram.botToken', label: 'Telegram Bot Token', type: 'password', placeholder: '123456:ABC...' },
    { key: 'telegram.enabled',  label: 'Telegram bot',       type: 'toggle' },
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

function AgentCard({ agent, onSave }) {
  const availableTools = AGENT_TOOLS[agent.slug] || []
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
  const [editingField, setEditingField] = useState(null)
  const [fieldDraft, setFieldDraft] = useState('')
  const [confirmField, setConfirmField] = useState(null)
  const [fieldSaving, setFieldSaving] = useState(false)
  const { Icon, color, bg, border } = AGENT_ICONS[agent.slug] || { Icon: Bot, color: 'text-text-muted', bg: 'bg-bg-secondary', border: 'border-border' }
  const integrations = INTEGRATION_CONFIG[agent.slug] || []

  const startEditField = (key) => { setEditingField(key); setFieldDraft(''); setConfirmField(null) }
  const cancelEditField = () => { setEditingField(null); setFieldDraft(''); setConfirmField(null) }

  const handleFieldSave = async (key) => {
    setFieldSaving(true)
    try {
      const newIntegrations = setNestedValue(form.integrations, key, fieldDraft)
      await onSave(agent.id, { integrations: newIntegrations })
      setForm(f => ({ ...f, integrations: newIntegrations }))
      cancelEditField()
    } catch {
      // xato parent da ko'rsatiladi
    } finally {
      setFieldSaving(false)
    }
  }

  const toggleTool = (tool) => {
    setForm(f => ({
      ...f,
      tools: f.tools.includes(tool) ? f.tools.filter(t => t !== tool) : [...f.tools, tool],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
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
      if (agent.slug === 'pr-agent') {
        try { localStorage.setItem('goodtires-pr-integrations', JSON.stringify(form.integrations)) } catch {}
      }
      if (agent.slug === 'customer-agent') {
        try { localStorage.setItem('goodtires-customer-integrations', JSON.stringify(form.integrations)) } catch {}
      }
      if (agent.slug === 'instagram-agent') {
        try { localStorage.setItem('goodtires-instagram-integrations', JSON.stringify(form.integrations)) } catch {}
      }
      clearAnalysisCache(agent.slug)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // xato AiAgentsTab.saveError orqali ko'rsatiladi
    } finally {
      setSaving(false)
    }
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

                    ) : cfg.type === 'password' ? (
                      editingField === cfg.key ? (
                        confirmField === cfg.key ? (
                          <div className="flex-1 flex items-center gap-2">
                            <span className="text-xs text-text-muted">Saqlaysizmi?</span>
                            <button
                              onClick={() => handleFieldSave(cfg.key)}
                              disabled={fieldSaving}
                              className="px-2 py-0.5 text-xs bg-accent-green text-white rounded"
                            >
                              {fieldSaving ? '...' : 'Ha'}
                            </button>
                            <button
                              onClick={() => setConfirmField(null)}
                              className="px-2 py-0.5 text-xs border border-border rounded text-text-muted"
                            >
                              Yo'q
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={fieldDraft}
                              onChange={e => setFieldDraft(e.target.value)}
                              placeholder={cfg.placeholder}
                              autoFocus
                              className="flex-1 bg-bg-primary border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent-green/50"
                            />
                            {fieldDraft && (
                              <button
                                onClick={() => setConfirmField(cfg.key)}
                                className="px-2 py-0.5 text-xs bg-accent-green text-white rounded whitespace-nowrap"
                              >
                                Saqlash
                              </button>
                            )}
                            <button
                              onClick={cancelEditField}
                              className="px-2 py-0.5 text-xs border border-border rounded text-text-muted"
                            >
                              Bekor
                            </button>
                          </div>
                        )
                      ) : (
                        <div className="flex-1 flex items-center justify-between">
                          {getNestedValue(form.integrations, cfg.key)
                            ? <span className="text-text-muted text-sm tracking-widest">●●●●●●●●</span>
                            : <span className="text-xs text-text-muted italic">Kiritilmagan</span>
                          }
                          <button
                            onClick={() => startEditField(cfg.key)}
                            className="text-xs text-accent-blue hover:underline ml-2 whitespace-nowrap"
                          >
                            {getNestedValue(form.integrations, cfg.key) ? 'O\'zgartirish' : 'Kiritish'}
                          </button>
                        </div>
                      )

                    ) : (
                      <input
                        type="text"
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [cacheCleared, setCacheCleared] = useState(false)
  const { aiAutoAnalysisHour, setAiAutoAnalysisHour } = useSettingsStore()

  const handleClearCache = () => {
    clearAllAnalysisCache()
    setCacheCleared(true)
    setTimeout(() => setCacheCleared(false), 2000)
  }

  useEffect(() => {
    getAiAgents()
      .then(a => setAgents(a))
      .catch(e => setError(e?.response?.data?.error || e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (id, payload) => {
    setSaveError(null)
    try {
      const updated = await updateAiAgent(id, payload)
      setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a))
    } catch (e) {
      setSaveError(e?.response?.data?.error || e.message || 'Saqlashda xato')
      throw e
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="p-4 sm:p-6 text-center">
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
      {saveError && (
        <div className="p-3 bg-accent-red/10 border border-accent-red/30 rounded-xl text-sm text-accent-red">
          {saveError}
        </div>
      )}
      {agents.map(agent => (
        <AgentCard
          key={agent.slug}
          agent={agent}
          onSave={handleSave}
        />
      ))}
    </div>
  )
}
