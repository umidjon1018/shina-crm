import React, { useState, useEffect, useMemo, useRef } from 'react'
import { AlertCircle, CheckCircle2, Eye, ImagePlus, Send, Users, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../../../store/settingsStore'
import { getCustomers } from '../../../api/customerService'
import { previewSegment, sendCampaign, getCampaigns, getTgSettings } from '../../../api/marketingService'
import { fmtDT } from '../components/mkHelpers'

const inputCls = 'w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red'
const Label = ({ children }) => <label className="text-text-secondary text-xs font-semibold mb-1.5 block">{children}</label>
const Chip = ({ on, onClick, children }) => (
  <button type="button" onClick={onClick}
    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${on ? 'border-accent-red bg-accent-red/10 text-accent-red' : 'border-border bg-bg-tertiary text-text-secondary'}`}>{children}</button>
)
const MAX_IMAGE = 5 * 1024 * 1024

const MessagesTab = ({ goSettings }) => {
  const { t } = useTranslation()
  const { sources } = useSettingsStore()
  const [customers, setCustomers] = useState([])
  const [cfg, setCfg] = useState(null)
  const [seg, setSeg] = useState({ groups: [], tags: [], birthdayMonth: '', inactiveDays: '', minSpent: '', maxSpent: '', hasDebt: false, neverBought: false, sources: [] })
  const [preview, setPreview] = useState(null)
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const [campaigns, setCampaigns] = useState([])
  const fileRef = useRef(null)

  const loadCampaigns = () => getCampaigns().then(setCampaigns).catch(() => {})
  useEffect(() => {
    getCustomers().then(setCustomers).catch(() => {})
    getTgSettings().then(setCfg).catch(() => setCfg(null))
    loadCampaigns()
  }, [])
  useEffect(() => {
    if (!campaigns.some(c => c.status === 'sending')) return
    const id = setInterval(loadCampaigns, 4000)
    return () => clearInterval(id)
  }, [campaigns])

  const groups = useMemo(() => [...new Set(customers.map(c => c.group).filter(Boolean))].sort(), [customers])
  const tags = useMemo(() => [...new Set(customers.flatMap(c => c.tags || []))].sort(), [customers])
  const segmentBody = () => ({
    ...seg,
    birthdayMonth: seg.birthdayMonth ? Number(seg.birthdayMonth) : undefined,
    inactiveDays: seg.inactiveDays ? Number(seg.inactiveDays) : undefined,
    minSpent: seg.minSpent ? Number(seg.minSpent) : undefined,
    maxSpent: seg.maxSpent ? Number(seg.maxSpent) : undefined,
  })
  const setS = (k, v) => { setSeg(x => ({ ...x, [k]: v })); setPreview(null) }
  const toggleIn = (k, v) => setS(k, seg[k].includes(v) ? seg[k].filter(x => x !== v) : [...seg[k], v])

  const pickImage = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) return setError(t('mkt_tg_err_image_type'))
    if (f.size > MAX_IMAGE) return setError(t('mkt_tg_err_image_size'))
    const r = new FileReader()
    r.onload = () => setImage(r.result)
    r.readAsDataURL(f)
  }

  const doPreview = async () => { setError(''); try { setPreview(await previewSegment(segmentBody())) } catch (e) { setError(e?.response?.data?.error || t('exp_err_generic')) } }
  const doSend = async () => {
    setError(''); setDone('')
    if (!text.trim() && !image) return setError(t('mkt_tg_err_text'))
    const p = preview || await previewSegment(segmentBody()).catch(() => null)
    if (!p?.count) return setError(t('mkt_tg_err_empty'))
    if (!window.confirm(t('mkt_tg_confirm', { n: p.count }))) return
    setSending(true)
    try {
      const r = await sendCampaign({ name, segment: segmentBody(), text, image })
      setDone(t('mkt_tg_started', { n: r.total }))
      setText(''); setName(''); setImage(null)
      loadCampaigns()
    } catch (e) {
      setError(e?.response?.data?.error || t('exp_err_generic'))
    } finally { setSending(false) }
  }

  const limit = image ? 1024 : 4096
  const months = t('exp_month_names', { returnObjects: true })

  return (
    <div className="space-y-4">
      {cfg && cfg.mode !== 'live' && (
        <div className="flex items-center justify-between gap-2 text-sm bg-accent-orange/10 text-accent-orange px-4 py-3 rounded-xl flex-wrap">
          <span className="flex items-center gap-2"><AlertCircle size={15} /> {t(cfg.mode === 'test' ? 'mkt_tg_test_mode' : 'mkt_tg_off')}</span>
          {goSettings && <button onClick={goSettings} className="text-xs font-bold underline">{t('mkt_tg_open_settings')}</button>}
        </div>
      )}
      {cfg && (
        <p className="text-xs text-text-muted">{t('mkt_tg_linked_total', { n: cfg.linkedCustomers || 0 })}</p>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        <div className="bg-bg-secondary border border-border rounded-2xl p-4 space-y-4">
          <h3 className="font-syne font-bold text-text-primary flex items-center gap-2"><Users size={17} className="text-accent-red" /> {t('mkt_tg_segment')}</h3>
          <p className="text-xs text-text-muted">{t('mkt_tg_segment_hint')}</p>
          {groups.length > 0 && (
            <div><Label>{t('mkt_groups')}</Label><div className="flex flex-wrap gap-1.5">{groups.map(g => <Chip key={g} on={seg.groups.includes(g)} onClick={() => toggleIn('groups', g)}>{g}</Chip>)}</div></div>
          )}
          {tags.length > 0 && (
            <div><Label>{t('mkt_tg_tags')}</Label><div className="flex flex-wrap gap-1.5">{tags.map(g => <Chip key={g} on={seg.tags.includes(g)} onClick={() => toggleIn('tags', g)}>{g}</Chip>)}</div></div>
          )}
          {(sources || []).length > 0 && (
            <div><Label>{t('mkt_tg_sources')}</Label><div className="flex flex-wrap gap-1.5">{sources.map(s => <Chip key={s.id} on={seg.sources.includes(s.id)} onClick={() => toggleIn('sources', s.id)}>{s.label}</Chip>)}</div></div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('mkt_tg_bday_month')}</Label>
              <select value={seg.birthdayMonth} onChange={e => setS('birthdayMonth', e.target.value)} className={inputCls}>
                <option value="">—</option>
                {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div><Label>{t('mkt_tg_inactive')}</Label><input type="number" min="0" value={seg.inactiveDays} onChange={e => setS('inactiveDays', e.target.value)} placeholder="60" className={inputCls} /></div>
            <div><Label>{t('mkt_tg_min_spent')}</Label><input type="number" min="0" value={seg.minSpent} onChange={e => setS('minSpent', e.target.value)} className={inputCls} /></div>
            <div><Label>{t('mkt_tg_max_spent')}</Label><input type="number" min="0" value={seg.maxSpent} onChange={e => setS('maxSpent', e.target.value)} className={inputCls} /></div>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer"><input type="checkbox" checked={seg.hasDebt} onChange={e => setS('hasDebt', e.target.checked)} className="w-4 h-4 accent-[#E63946]" /> {t('mkt_tg_has_debt')}</label>
            <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer"><input type="checkbox" checked={seg.neverBought} onChange={e => setS('neverBought', e.target.checked)} className="w-4 h-4 accent-[#E63946]" /> {t('mkt_tg_never_bought')}</label>
          </div>
          <button onClick={doPreview} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:text-text-primary">
            <Eye size={15} /> {t('mkt_tg_preview')}
          </button>
          {preview && (
            <div className="rounded-xl bg-bg-tertiary p-3 space-y-1.5">
              <p className="text-sm font-bold text-text-primary">{t('mkt_tg_recipients', { n: preview.count })}</p>
              <p className="text-xs text-text-secondary">{t('mkt_tg_preview_stats', { matched: preview.matched, linked: preview.linked, optout: preview.optout })}</p>
              {preview.sample.length > 0 && <p className="text-xs text-text-muted">{preview.sample.map(s => s.name).join(', ')}{preview.count > preview.sample.length ? '…' : ''}</p>}
            </div>
          )}
        </div>

        <div className="bg-bg-secondary border border-border rounded-2xl p-4 space-y-4">
          <h3 className="font-syne font-bold text-text-primary flex items-center gap-2"><Send size={17} className="text-accent-red" /> {t('mkt_tg_message')}</h3>
          <div><Label>{t('mkt_tg_campaign_name')}</Label><input value={name} onChange={e => setName(e.target.value)} placeholder={t('mkt_tg_campaign_name_ph')} className={inputCls} /></div>
          <div>
            <Label>{t('mkt_tg_text')}</Label>
            <textarea value={text} onChange={e => setText(e.target.value.slice(0, limit))} rows={6} placeholder={t('mkt_tg_text_ph')} className={inputCls + ' resize-none'} />
            <div className="flex items-center justify-between mt-1 text-[11px] text-text-muted">
              <span>{t('mkt_tg_vars')} <button type="button" className="font-mono text-accent-blue" onClick={() => setText(x => x + '{name}')}>{'{name}'}</button> <button type="button" className="font-mono text-accent-blue" onClick={() => setText(x => x + '{shop}')}>{'{shop}'}</button></span>
              <span>{text.length} / {limit}</span>
            </div>
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickImage} className="hidden" />
            {image ? (
              <div className="relative inline-block">
                <img src={image} alt="" className="max-h-40 rounded-xl border border-border" />
                <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent-red text-white flex items-center justify-center"><X size={13} /></button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border text-xs font-semibold text-text-secondary hover:text-text-primary">
                <ImagePlus size={15} /> {t('mkt_tg_add_image')}
              </button>
            )}
          </div>
          {error && <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg"><AlertCircle size={15} /> {error}</div>}
          {done && <div className="flex items-center gap-2 text-accent-green text-sm bg-accent-green/10 px-3 py-2 rounded-lg"><CheckCircle2 size={15} /> {done}</div>}
          <button onClick={doSend} disabled={sending} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm disabled:opacity-50">
            <Send size={15} /> {sending ? t('exp_form_saving') : t('mkt_tg_send')}
          </button>
          <p className="text-[11px] text-text-muted">{t('mkt_tg_optout_note')}</p>
        </div>
      </div>

      <div className="bg-bg-secondary border border-border rounded-2xl overflow-x-auto">
        <div className="px-4 py-3 border-b border-border font-syne font-bold text-text-primary">{t('mkt_tg_history')}</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs">
              <th className="text-left px-4 py-2.5 text-text-secondary font-medium">{t('col_date')}</th>
              <th className="text-left px-4 py-2.5 text-text-secondary font-medium">{t('mkt_tg_campaign_name')}</th>
              <th className="text-left px-4 py-2.5 text-text-secondary font-medium">{t('mkt_tg_text')}</th>
              <th className="text-right px-4 py-2.5 text-text-secondary font-medium">{t('mkt_tg_progress')}</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-text-muted">{t('mkt_tg_no_campaigns')}</td></tr>}
            {campaigns.map(c => (
              <tr key={c.id} className="border-b border-border/50">
                <td className="px-4 py-2.5 text-text-secondary text-xs whitespace-nowrap">{fmtDT(c.created_at)}</td>
                <td className="px-4 py-2.5 text-text-primary">{c.name || '—'}<div className="text-[11px] text-text-muted">{c.created_by_name}</div></td>
                <td className="px-4 py-2.5 text-text-secondary text-xs max-w-[320px] truncate">{c.has_image ? '🖼 ' : ''}{c.text}</td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap text-xs">
                  <span className="text-accent-green font-bold">{c.sent}</span>
                  {c.failed > 0 && <span className="text-accent-red font-bold"> / {c.failed}</span>}
                  <span className="text-text-muted"> / {c.total}</span>
                  {c.status === 'sending' && <span className="ml-1.5 text-accent-orange">{t('mkt_tg_sending')}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default MessagesTab
