import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageCircle, Zap, BookOpen, Link2, Lock, ChevronDown, ChevronUp } from 'lucide-react'
import { getBotTools } from '../../../api/aiAgentsService'
import { CardShell, BaseRules, Field, SaveBar, Toggle, useSaver } from './AiAnalysisAgents'

const BOT_MODELS = [
  { value: 'claude-haiku-4-5-20251001', key: 'aiadm_bot_model_haiku' },
  { value: 'claude-sonnet-5-5', key: 'aiadm_bot_model_sonnet' },
]

// Kanallar: holat integrations.instagram.* da (webhooklar shuni o'qiydi)
const CHANNELS = [
  { id: 'comment', flag: 'enabled' },
  { id: 'dm', flag: 'dmEnabled' },
  { id: 'telegram', flag: null },
]

// Instagram ulanish maydonlari (maxfiylari serverdan "__set__" bo'lib keladi va alohida saqlanadi)
const INTEGRATION_FIELDS = [
  { key: 'instagram.handle',        labelKey: 'aiadm_bot_ig_handle',  type: 'text',     placeholder: '@goodtires_uz' },
  { key: 'instagram.accessToken',   labelKey: 'aiadm_bot_ig_token',   type: 'password', placeholder: 'IGAA...' },
  { key: 'instagram.pageId',        labelKey: 'aiadm_bot_ig_page',    type: 'text',     placeholder: '27509075055455614' },
  { key: 'instagram.userId',        labelKey: 'aiadm_bot_ig_user',    type: 'text',     placeholder: '17841437993304690' },
  { key: 'instagram.webhookSecret', labelKey: 'aiadm_bot_ig_secret',  type: 'password', placeholder: 'mysecret' },
  { key: 'anthropic.apiKey',        labelKey: 'aiadm_bot_api_key',    type: 'password', placeholder: 'sk-ant-...' },
]

const getNested = (obj, path) => path.split('.').reduce((o, k) => (o || {})[k], obj)
const setNested = (obj, path, value) => {
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

function SecretField({ field, value, onSaveSecret, t }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const cancel = () => { setEditing(false); setDraft(''); setConfirm(false) }
  const save = async () => {
    setSaving(true)
    try { await onSaveSecret(field.key, draft); cancel() } catch { /* xato ota komponentda */ } finally { setSaving(false) }
  }
  if (!editing) return (
    <div className="flex-1 flex items-center justify-between">
      {value ? <span className="text-text-muted text-sm tracking-widest">●●●●●●●●</span> : <span className="text-xs text-text-muted italic">{t('aiadm_bot_not_set')}</span>}
      <button type="button" onClick={() => setEditing(true)} className="text-xs text-accent-blue hover:underline ml-2 whitespace-nowrap">
        {value ? t('aiadm_bot_change') : t('aiadm_bot_enter')}
      </button>
    </div>
  )
  if (confirm) return (
    <div className="flex-1 flex items-center gap-2">
      <span className="text-xs text-text-muted">{t('aiadm_bot_confirm_save')}</span>
      <button type="button" onClick={save} disabled={saving} className="px-2 py-0.5 text-xs bg-accent-green text-white rounded">{saving ? '...' : t('aiadm_bot_yes')}</button>
      <button type="button" onClick={() => setConfirm(false)} className="px-2 py-0.5 text-xs border border-border rounded text-text-muted">{t('aiadm_bot_no')}</button>
    </div>
  )
  return (
    <div className="flex-1 flex items-center gap-2 min-w-0">
      <input type="text" value={draft} onChange={e => setDraft(e.target.value)} placeholder={field.placeholder} autoFocus
        className="flex-1 min-w-0 bg-bg-primary border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none" />
      {draft && <button type="button" onClick={() => setConfirm(true)} className="px-2 py-0.5 text-xs bg-accent-green text-white rounded whitespace-nowrap">{t('aiadm_save')}</button>}
      <button type="button" onClick={cancel} className="px-2 py-0.5 text-xs border border-border rounded text-text-muted">{t('aiadm_bot_cancel')}</button>
    </div>
  )
}

function ChannelBlock({ ch, form, setForm, agent, t }) {
  const [showRules, setShowRules] = useState(false)
  const on = ch.flag ? getNested(form.integrations, `instagram.${ch.flag}`) === true : false
  const toggle = () => setForm(f => ({ ...f, integrations: setNested(f.integrations, `instagram.${ch.flag}`, !on) }))
  const tools = agent.channelTools?.[ch.id] || []
  return (
    <div className="p-3 rounded-lg border border-border space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-text-primary">{t(`aiadm_bot_ch_${ch.id}`)}</p>
          <p className="text-[11px] text-text-muted">{t(`aiadm_bot_ch_${ch.id}_hint`)}</p>
        </div>
        {ch.flag ? <Toggle on={on} onClick={toggle} t={t} /> : <span className="text-[11px] px-2 py-0.5 rounded-full bg-bg-secondary text-text-muted border border-border flex-shrink-0">{t('aiadm_bot_soon')}</span>}
      </div>
      {ch.flag && (
        <>
          <button type="button" onClick={() => setShowRules(v => !v)} className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-primary">
            <Lock size={11} /> {t('aiadm_bot_ch_rules')} {showRules ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showRules && <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-text-secondary font-mono bg-bg-secondary rounded-lg p-2.5 max-h-60 overflow-y-auto">{agent.sectionPrompts?.[ch.id]}</pre>}
          <p className="text-[11px] text-text-muted">{t('aiadm_bot_ch_tools')}: {tools.map(x => t(`aitool_${x}`, { defaultValue: x })).join(', ')}</p>
          <Field label={t('aiadm_bot_ch_custom')} value={form.channels[ch.id] || ''} rows={2}
            placeholder={t(`aiadm_bot_ch_${ch.id}_ph`)} onChange={v => setForm(f => ({ ...f, channels: { ...f.channels, [ch.id]: v } }))} />
        </>
      )}
    </div>
  )
}

// Mijozlar boti: bitta bot — Instagram komment, Instagram DM (keyinchalik Telegram)
export default function CustomerBotCard({ agent, onSave }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    isActive: agent.isActive, model: agent.model, customInstructions: agent.customInstructions,
    knowledge: agent.knowledge || '', tools: agent.tools || [], integrations: agent.integrations || {},
    channels: Object.fromEntries(CHANNELS.map(c => [c.id, agent.sectionInstructions?.[c.id]?.text || ''])),
  })
  const [catalog, setCatalog] = useState([])
  const { saving, saved, save } = useSaver(onSave)
  useEffect(() => { getBotTools().then(setCatalog).catch(() => {}) }, [])

  const toggleTool = (name) => setForm(f => ({ ...f, tools: f.tools.includes(name) ? f.tools.filter(x => x !== name) : [...f.tools, name] }))
  const submit = () => save(agent.id, {
    is_active: form.isActive, model: form.model, custom_instructions: form.customInstructions, knowledge: form.knowledge,
    tools: form.tools, integrations: form.integrations,
    section_instructions: Object.fromEntries(CHANNELS.map(c => [c.id, { text: form.channels[c.id] || '' }])),
  })
  // Maxfiy maydon darhol alohida saqlanadi (boshqa o'zgarishlarni kutmaydi)
  const saveSecret = async (key, value) => {
    const integrations = setNested(form.integrations, key, value)
    await onSave(agent.id, { integrations })
    setForm(f => ({ ...f, integrations: setNested(f.integrations, key, '__set__') }))
  }

  return (
    <CardShell icon={MessageCircle} color={{ bg: 'bg-pink-500/10', text: 'text-pink-400' }} title={t('aiadm_bot')} desc={t('aiadm_bot_desc')}
      isActive={form.isActive} onToggle={() => setForm(f => ({ ...f, isActive: !f.isActive }))} t={t}>
      <div>
        <label className="text-xs font-medium text-text-secondary mb-1 block">{t('aiadm_model')}</label>
        <select value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
          className="w-full sm:w-auto bg-bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none">
          {BOT_MODELS.map(m => <option key={m.value} value={m.value}>{t(m.key)}</option>)}
        </select>
      </div>
      <BaseRules text={agent.basePrompt} t={t} />
      <Field label={t('aiadm_custom')} hint={t('aiadm_custom_hint')} value={form.customInstructions} rows={4}
        placeholder={t('aiadm_bot_custom_ph')} onChange={v => setForm(f => ({ ...f, customInstructions: v }))} />
      <Field label={t('aiadm_knowledge')} icon={BookOpen} hint={t('aiadm_bot_knowledge_hint')} value={form.knowledge} rows={4}
        placeholder={t('aiadm_bot_knowledge_ph')} onChange={v => setForm(f => ({ ...f, knowledge: v }))} />

      <div className="space-y-2">
        <p className="text-xs font-medium text-text-secondary">{t('aiadm_bot_channels')}</p>
        {CHANNELS.map(ch => <ChannelBlock key={ch.id} ch={ch} form={form} setForm={setForm} agent={agent} t={t} />)}
      </div>

      {catalog.length > 0 && (
        <div>
          <label className="text-xs font-medium text-text-secondary mb-1 flex items-center gap-1.5"><Zap size={12} /> {t('aiadm_bot_tools')}</label>
          <p className="text-[11px] text-text-muted mb-2">{t('aiadm_bot_tools_hint')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {catalog.map(tool => {
              const on = form.tools.includes(tool.name)
              return (
                <button key={tool.name} type="button" onClick={() => toggleTool(tool.name)} title={tool.description}
                  className={`flex items-start gap-2 px-2.5 py-2 rounded-lg border text-left ${on ? 'border-pink-500/40 bg-pink-500/5' : 'border-border hover:bg-bg-secondary'}`}>
                  <span className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${on ? 'border-pink-400 text-pink-400' : 'border-border'}`}>
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

      <div>
        <label className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1.5"><Link2 size={12} /> {t('aiadm_bot_connection')}</label>
        <div className="space-y-2 p-3 bg-bg-secondary rounded-lg border border-border">
          {INTEGRATION_FIELDS.map(f => (
            <div key={f.key} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <span className="text-xs text-text-secondary sm:w-48 flex-shrink-0">{t(f.labelKey)}</span>
              {f.type === 'password'
                ? <SecretField field={f} value={getNested(form.integrations, f.key)} onSaveSecret={saveSecret} t={t} />
                : <input type="text" value={getNested(form.integrations, f.key) || ''} placeholder={f.placeholder}
                    onChange={e => setForm(fm => ({ ...fm, integrations: setNested(fm.integrations, f.key, e.target.value) }))}
                    className="flex-1 min-w-0 bg-bg-primary border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none" />}
            </div>
          ))}
        </div>
      </div>

      <SaveBar saving={saving} saved={saved} onSave={submit} t={t} />
    </CardShell>
  )
}
