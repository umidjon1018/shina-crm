import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, BarChart3, Copy, Handshake, Megaphone, Plus, Power, Search, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import DateMaskInput from '../../../components/DateMaskInput'
import { useSettingsStore } from '../../../store/settingsStore'
import { getCodes, createCodes, updateCode, deleteCode, getCodesReport } from '../../../api/marketingService'
import { getPromotions } from '../../../api/promotionService'
import { fmtMoney, fmtD } from '../components/mkHelpers'
import PeriodPicker, { presetRange } from '../../Expenses/components/PeriodPicker'

const inputCls = 'w-full bg-bg-tertiary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red'
const Label = ({ children }) => <label className="text-text-secondary text-xs font-semibold mb-1.5 block">{children}</label>

const CodeFormModal = ({ kind, onClose, onSaved }) => {
  const { t } = useTranslation()
  const { sources } = useSettingsStore()
  const [promos, setPromos] = useState([])
  const [f, setF] = useState({
    code: '', channel: '', partner: '', count: 20, prefix: '', max_uses: '', per_customer_limit: kind === 'channel' ? 1 : '',
    expires_at: '', mode: 'simple', discount_type: 'percent', discount_value: 10, min_total: 0, promotion_id: '', note: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))
  useEffect(() => { getPromotions().then(list => setPromos(list.filter(p => p.requiresCode && p.isActive))).catch(() => {}) }, [])

  const submit = async () => {
    setError('')
    if (kind === 'channel' && f.code.trim().length < 3) return setError(t('mkt_code_err_short'))
    if (kind === 'voucher' && !f.partner.trim()) return setError(t('mkt_code_err_partner'))
    if (f.mode === 'promo' && !f.promotion_id) return setError(t('mkt_code_err_promo'))
    setSaving(true)
    try {
      const body = {
        kind, code: f.code, channel: f.channel, partner: f.partner, count: f.count, prefix: f.prefix,
        max_uses: f.max_uses, per_customer_limit: f.per_customer_limit, expires_at: f.expires_at || null, note: f.note,
        ...(f.mode === 'promo' ? { promotion_id: f.promotion_id } : { discount_type: f.discount_type, discount_value: f.discount_value, min_total: f.min_total }),
      }
      const created = await createCodes(body)
      onSaved(created)
      onClose()
    } catch (e) {
      setError(e?.response?.data?.error || t('exp_err_generic'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-lg shadow-2xl z-10 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border sticky top-0 bg-bg-secondary z-10">
          <h3 className="font-syne font-bold text-lg text-text-primary">{kind === 'voucher' ? t('mkt_voucher_new') : t('mkt_code_new')}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-bg-tertiary rounded-lg"><X size={18} className="text-text-secondary" /></button>
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          {kind === 'channel' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('mkt_code')}</Label>
                <input value={f.code} onChange={e => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))} placeholder="INSTA10" className={inputCls + ' uppercase'} autoFocus />
              </div>
              <div>
                <Label>{t('mkt_channel')}</Label>
                <input list="mkt-channels" value={f.channel} onChange={e => set('channel', e.target.value)} placeholder="Instagram" className={inputCls} />
                <datalist id="mkt-channels">
                  {['Instagram', 'Telegram', 'Facebook', 'YouTube', 'Banner', 'Radio', ...(sources || []).map(s => s.label)].filter((v, i, a) => a.indexOf(v) === i).map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 sm:col-span-1">
                <Label>{t('mkt_partner')}</Label>
                <input value={f.partner} onChange={e => set('partner', e.target.value)} placeholder={t('mkt_partner_ph')} className={inputCls} autoFocus />
              </div>
              <div><Label>{t('mkt_voucher_count')}</Label><input type="number" min="1" max="500" value={f.count} onChange={e => set('count', e.target.value)} className={inputCls} /></div>
              <div><Label>{t('mkt_prefix')}</Label><input value={f.prefix} onChange={e => set('prefix', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))} placeholder="MOY" className={inputCls} /></div>
            </div>
          )}

          <div>
            <Label>{t('mkt_code_discount')}</Label>
            <div className="flex gap-1.5 mb-2">
              {['simple', 'promo'].map(m => (
                <button key={m} type="button" onClick={() => set('mode', m)}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold ${f.mode === m ? 'border-accent-red bg-accent-red/10 text-accent-red' : 'border-border bg-bg-tertiary text-text-secondary'}`}>
                  {t('mkt_code_mode_' + m)}
                </button>
              ))}
            </div>
            {f.mode === 'simple' ? (
              <div className="grid grid-cols-3 gap-2">
                <select value={f.discount_type} onChange={e => set('discount_type', e.target.value)} className={inputCls}>
                  <option value="percent">%</option>
                  <option value="amount">{t('unit_som')}</option>
                </select>
                <input type="number" min="0" value={f.discount_value} onChange={e => set('discount_value', e.target.value)} className={inputCls} />
                <input type="number" min="0" value={f.min_total} onChange={e => set('min_total', e.target.value)} placeholder={t('mkt_min_total')} title={t('mkt_min_total')} className={inputCls} />
              </div>
            ) : (
              <>
                <select value={f.promotion_id} onChange={e => set('promotion_id', e.target.value)} className={inputCls}>
                  <option value="">{t('mkt_code_pick_promo')}</option>
                  {promos.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {promos.length === 0 && <p className="text-[11px] text-text-muted mt-1">{t('mkt_code_no_code_promos')}</p>}
              </>
            )}
            {f.mode === 'simple' && <p className="text-[11px] text-text-muted mt-1">{t('mkt_code_simple_hint')}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {kind === 'channel' && <div><Label>{t('mkt_max_uses')}</Label><input type="number" min="0" value={f.max_uses} onChange={e => set('max_uses', e.target.value)} placeholder="∞" className={inputCls} /></div>}
            <div><Label>{t('mkt_per_customer')}</Label><input type="number" min="0" value={f.per_customer_limit} onChange={e => set('per_customer_limit', e.target.value)} placeholder="∞" className={inputCls} /></div>
            <div className={kind === 'channel' ? '' : 'col-span-2'}><Label>{t('mkt_expires')}</Label><DateMaskInput value={f.expires_at} onChange={e => set('expires_at', e.target.value)} className={inputCls} /></div>
          </div>
          {kind === 'voucher' && <p className="text-[11px] text-text-muted">{t('mkt_voucher_hint')}</p>}
          <div><Label>{t('col_note')}</Label><input value={f.note} onChange={e => set('note', e.target.value)} className={inputCls} /></div>
          {error && <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg"><AlertCircle size={15} /> {error}</div>}
        </div>
        <div className="flex gap-3 p-4 sm:p-5 border-t border-border sticky bottom-0 bg-bg-secondary">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-medium">{t('cancel')}</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm disabled:opacity-50">
            {saving ? t('exp_form_saving') : t('add')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

const ReportView = () => {
  const { t } = useTranslation()
  const [preset, setPreset] = useState('month')
  const [range, setRange] = useState(presetRange('month'))
  const [rows, setRows] = useState([])
  useEffect(() => { getCodesReport(range).then(setRows).catch(() => setRows([])) }, [range.from, range.to])
  const total = rows.reduce((a, r) => ({ uses: a.uses + r.uses, revenue: a.revenue + r.revenue, discount: a.discount + r.discount }), { uses: 0, revenue: 0, discount: 0 })
  return (
    <div className="space-y-4">
      <PeriodPicker preset={preset} range={range} onChange={(p, r) => { setPreset(p); setRange(r) }} />
      <div className="bg-bg-secondary border border-border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs">
              <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('mkt_rep_source')}</th>
              <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('mkt_rep_codes')}</th>
              <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('mkt_rep_uses')}</th>
              <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('mkt_rep_customers')}</th>
              <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('mkt_rep_revenue')}</th>
              <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('mkt_rep_discount')}</th>
              <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('mkt_rep_avg')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="px-3 sm:px-4 py-5 sm:py-8 text-center text-text-muted">{t('mkt_rep_empty')}</td></tr>}
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="px-3 sm:px-4 py-2.5 text-text-primary font-semibold">
                  <span className="inline-flex items-center gap-1.5">{r.kind === 'voucher' ? <Handshake size={13} className="text-purple-500" /> : <Megaphone size={13} className="text-accent-blue" />}{r.name}</span>
                </td>
                <td className="px-3 sm:px-4 py-2.5 text-right text-text-secondary">{r.codes}</td>
                <td className="px-3 sm:px-4 py-2.5 text-right text-text-primary font-semibold">{r.uses}</td>
                <td className="px-3 sm:px-4 py-2.5 text-right text-text-secondary">{r.customers}</td>
                <td className="px-3 sm:px-4 py-2.5 text-right text-accent-green font-semibold whitespace-nowrap">{fmtMoney(r.revenue)}</td>
                <td className="px-3 sm:px-4 py-2.5 text-right text-accent-orange whitespace-nowrap">{fmtMoney(r.discount)}</td>
                <td className="px-3 sm:px-4 py-2.5 text-right text-text-secondary whitespace-nowrap">{r.uses ? fmtMoney(r.revenue / r.uses) : '—'}</td>
              </tr>
            ))}
            {rows.length > 0 && (
              <tr className="bg-bg-tertiary/60 font-bold">
                <td className="px-3 sm:px-4 py-2.5 text-text-primary">{t('fin_cf_total')}</td><td />
                <td className="px-3 sm:px-4 py-2.5 text-right text-text-primary">{total.uses}</td><td />
                <td className="px-3 sm:px-4 py-2.5 text-right text-accent-green whitespace-nowrap">{fmtMoney(total.revenue)}</td>
                <td className="px-3 sm:px-4 py-2.5 text-right text-accent-orange whitespace-nowrap">{fmtMoney(total.discount)}</td><td />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const CodesTab = () => {
  const { t } = useTranslation()
  const [view, setView] = useState('channel')
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(null)
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState('')

  const load = () => getCodes().then(setCodes).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const list = useMemo(() => codes
    .filter(c => c.kind === view && c.channel !== 'birthday')
    .filter(c => !search.trim() || `${c.code} ${c.channel} ${c.partner}`.toLowerCase().includes(search.toLowerCase())), [codes, view, search])

  const batches = useMemo(() => {
    const m = new Map()
    list.forEach(c => {
      const k = c.batchId || c.id
      if (!m.has(k)) m.set(k, { key: k, partner: c.partner, promotionName: c.promotionName, createdAt: c.createdAt, expiresAt: c.expiresAt, codes: [] })
      m.get(k).codes.push(c)
    })
    return [...m.values()]
  }, [list])

  const toggle = async (c) => { await updateCode(c.id, { is_active: !c.isActive }); load() }
  const remove = async (c) => {
    if (!window.confirm(t('mkt_code_delete_confirm', { code: c.code }))) return
    await deleteCode(c.id); load()
  }
  const copyBatch = (b) => {
    const text = b.codes.map(c => c.code).join('\n')
    navigator.clipboard?.writeText(text).then(() => { setCopied(b.key); setTimeout(() => setCopied(''), 1500) }).catch(() => {})
  }

  const VIEWS = [
    { id: 'channel', icon: Megaphone },
    { id: 'voucher', icon: Handshake },
    { id: 'report', icon: BarChart3 },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 bg-bg-secondary border border-border rounded-xl p-1">
          {VIEWS.map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold ${view === v.id ? 'bg-accent-red text-white' : 'text-text-secondary'}`}>
              <v.icon size={14} /> {t('mkt_codes_view_' + v.id)}
            </button>
          ))}
        </div>
        {view !== 'report' && (
          <>
            <div className="relative flex-1 min-w-[160px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('mkt_code_search')}
                className="w-full bg-bg-secondary border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-red" />
            </div>
            <button onClick={() => setForm(view)} className="flex items-center gap-2 px-4 py-2.5 bg-accent-red text-white rounded-xl font-semibold text-sm shrink-0">
              <Plus size={16} /> {view === 'voucher' ? t('mkt_voucher_new') : t('mkt_code_new')}
            </button>
          </>
        )}
      </div>
      <p className="text-xs text-text-muted">{t('mkt_codes_desc_' + view)}</p>

      {view === 'report' ? <ReportView /> : loading ? (
        <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" /></div>
      ) : view === 'channel' ? (
        <div className="bg-bg-secondary border border-border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs">
                <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('mkt_code')}</th>
                <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('mkt_channel')}</th>
                <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('mkt_code_discount')}</th>
                <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('mkt_rep_uses')}</th>
                <th className="text-right px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('mkt_rep_revenue')}</th>
                <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-secondary font-medium">{t('mkt_expires')}</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3" />
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={7} className="px-3 sm:px-4 py-5 sm:py-8 text-center text-text-muted">{t('mkt_code_empty')}</td></tr>}
              {list.map(c => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="px-3 sm:px-4 py-2.5 font-mono font-bold text-text-primary whitespace-nowrap">{c.code}
                    {!c.isActive && <span className="ml-1.5 font-sans px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-500/10 text-gray-500">{t('mkt_status_off')}</span>}
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 text-text-secondary">{c.channel || '—'}</td>
                  <td className="px-3 sm:px-4 py-2.5 text-text-secondary text-xs max-w-[200px] truncate">{c.promotionName || '—'}</td>
                  <td className="px-3 sm:px-4 py-2.5 text-right text-text-primary">{c.uses}{c.maxUses ? ` / ${c.maxUses}` : ''}</td>
                  <td className="px-3 sm:px-4 py-2.5 text-right text-accent-green whitespace-nowrap">{fmtMoney(c.revenue)}</td>
                  <td className="px-3 sm:px-4 py-2.5 text-text-secondary text-xs whitespace-nowrap">{c.expiresAt ? fmtD(c.expiresAt) : '∞'}</td>
                  <td className="px-3 sm:px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggle(c)} className={`p-1.5 rounded-lg ${c.isActive ? 'text-accent-green' : 'text-text-muted'}`}><Power size={14} /></button>
                      <button onClick={() => remove(c)} className="p-1.5 rounded-lg text-text-secondary hover:text-accent-red"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.length === 0 && <div className="bg-bg-secondary border border-border rounded-2xl p-10 text-center text-text-muted text-sm">{t('mkt_code_empty')}</div>}
          {batches.map(b => {
            const used = b.codes.filter(c => c.uses > 0).length
            const revenue = b.codes.reduce((s, c) => s + c.revenue, 0)
            return (
              <div key={b.key} className="bg-bg-secondary border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-bold text-text-primary flex items-center gap-1.5"><Handshake size={15} className="text-purple-500" /> {b.partner}</p>
                    <p className="text-xs text-text-muted">{b.promotionName} · {fmtD(b.createdAt)}{b.expiresAt ? ` → ${fmtD(b.expiresAt)}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-text-secondary">{t('mkt_voucher_used', { used, total: b.codes.length })}</span>
                    <span className="text-accent-green font-semibold">{fmtMoney(revenue)}</span>
                    <button onClick={() => copyBatch(b)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary">
                      <Copy size={12} /> {copied === b.key ? t('mkt_copied') : t('mkt_copy_codes')}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {b.codes.map(c => (
                    <span key={c.id} title={c.uses ? t('mkt_voucher_redeemed') : ''}
                      className={`px-2 py-1 rounded-md font-mono text-[11px] ${c.uses ? 'bg-accent-green/10 text-accent-green' : c.isActive ? 'bg-bg-tertiary text-text-primary' : 'bg-bg-tertiary text-text-muted'}`}>
                      {c.uses ? '✓ ' : ''}{c.code}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {form && <CodeFormModal kind={form} onClose={() => setForm(null)} onSaved={() => load()} />}
      </AnimatePresence>
    </div>
  )
}

export default CodesTab
