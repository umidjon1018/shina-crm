import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, Printer, CheckCircle2, Undo2, RotateCcw, Wallet, Plus, Minus } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import { DetailGrid } from '../../../components/ui/Kit'
import { toast, errorText } from '../../../components/ui/Toast'
import { useAuthStore } from '../../../store/authStore'
import { useDataStore } from '../../../store/dataStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { getWhDoc, settleWhDoc, takeBackWhDoc, returnWhDoc } from '../../../api/wholesaleService'
import { formatNumber, formatDate, formatDateTime } from '../../../utils/format'
import { KindBadge, PayBadge, SourceBadge, MethodPicker, Spinner, inputCls, labelCls, som, sizeOf, methodLabel, printDoc, useWh } from './whHelpers'

const n = (v) => Number(v) || 0

// Konsignatsiyadan sotildi / qaytib keldi yoki sotuvdan qaytarish — qaysi tovardan nechta
const LineActionModal = ({ doc, mode, onClose, onDone }) => {
  const { t } = useTranslation()
  const { bump } = useDataStore()
  const field = mode === 'return' ? 'sold' : 'consigned'
  const avail = (doc?.lines || []).filter(l => l[field] > 0)
  const [qty, setQty] = useState({})
  const [paid, setPaid] = useState('')
  const [method, setMethod] = useState('cash')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const key = (l) => l.productId + ':' + l.price
  const ratio = doc && doc.subtotal > 0 ? doc.total / doc.subtotal : 1
  const sum = avail.reduce((s, l) => s + n(qty[key(l)]) * l.price, 0) * ratio
  const count = avail.reduce((s, l) => s + n(qty[key(l)]), 0)

  const submit = async () => {
    setErr('')
    if (!count) return setErr(t('wh_err_qty'))
    // Bir tovar bir necha narxda bo'lishi mumkin — server tovar bo'yicha oladi
    const byProduct = {}
    avail.forEach(l => { const q = n(qty[key(l)]); if (q > 0) byProduct[l.productId] = (byProduct[l.productId] || 0) + q })
    const body = { lines: Object.entries(byProduct).map(([product_id, q]) => ({ product_id, qty: q })) }
    if (mode === 'settle') Object.assign(body, { paid_amount: Math.min(sum, n(paid)), payment_method: method })
    setSaving(true)
    try {
      const fn = mode === 'settle' ? settleWhDoc : mode === 'take-back' ? takeBackWhDoc : returnWhDoc
      const res = await fn(doc.id, body)
      toast(t('wh_doc_saved', { no: res.no }))
      bump()
      onDone?.(res)
    } catch (e) { setErr(errorText(e, t('exp_err_generic'))) } finally { setSaving(false) }
  }

  const title = { settle: t('wh_act_settle'), 'take-back': t('wh_act_take_back'), return: t('wh_act_return') }[mode]
  return (
    <Modal open={!!mode} onClose={onClose} size="md" title={title} subtitle={doc ? `${doc.no} · ${doc.clientName}` : ''}
      footer={
        <div className="space-y-2">
          {err && <div className="text-sm text-accent-red bg-accent-red/10 px-3 py-2.5 rounded-xl">{err}</div>}
          <div className="flex items-center gap-3">
            <div className="flex-1"><p className="text-sm text-text-muted">{t('wh_qty_n', { n: count })}</p><p className="text-lg font-bold">{som(t, sum)}</p></div>
            <button onClick={submit} disabled={saving || !count} className="px-6 py-3 rounded-xl g-brand text-white font-bold disabled:opacity-50">{saving ? '...' : t('wh_confirm')}</button>
          </div>
        </div>
      }>
      <div className="space-y-4">
        <p className="text-sm text-text-muted">{t('wh_act_hint_' + mode.replace('-', '_'))}</p>
        <div className="panel divide-y divide-border">
          {avail.map(l => {
            const k = key(l), max = l[field], v = n(qty[k])
            const set = (x) => setQty(s => ({ ...s, [k]: Math.max(0, Math.min(max, x)) }))
            return (
              <div key={k} className="p-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[160px]">
                  <p className="text-[15px] font-semibold text-text-primary">{l.name}</p>
                  <p className="text-sm text-text-muted">{[sizeOf(l.name, l.size), formatNumber(l.price), t('wh_available_n', { n: max })].filter(Boolean).join(' · ')}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => set(v - 1)} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-bg-tertiary"><Minus size={16} /></button>
                  <input type="number" min="0" max={max} value={qty[k] ?? ''} placeholder="0" onChange={e => set(n(e.target.value))}
                    className="w-16 text-center bg-bg-tertiary border border-border rounded-lg py-1.5 text-[15px] font-semibold text-text-primary" />
                  <button type="button" onClick={() => set(v + 1)} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-bg-tertiary"><Plus size={16} /></button>
                  <button type="button" onClick={() => set(max)} className="ml-1 px-2.5 h-9 rounded-lg border border-border text-sm font-semibold text-text-secondary hover:bg-bg-tertiary">{t('wh_all')}</button>
                </div>
              </div>
            )
          })}
        </div>
        {mode === 'settle' && (
          <div className="space-y-2">
            <label className={labelCls}>{t('wh_paid_now')}</label>
            <input type="number" min="0" value={paid} onChange={e => setPaid(e.target.value)} placeholder="0" className={inputCls} />
            {n(paid) > 0 && <MethodPicker value={method} onChange={setMethod} t={t} />}
          </div>
        )}
      </div>
    </Modal>
  )
}

// Hujjat: qatorlar, bog'liq hujjatlar, to'lovlar, amallar
const DocDetailModal = ({ docId, onClose }) => {
  const { t } = useTranslation()
  const { version } = useDataStore()
  const hasPermission = useAuthStore(s => s.hasPermission)
  const company = useSettingsStore(s => s.companyName)
  const wh = useWh()
  const [doc, setDoc] = useState(null)
  const [action, setAction] = useState(null)
  const [sub, setSub] = useState(null)

  useEffect(() => {
    if (!docId) { setDoc(null); return }
    getWhDoc(docId).then(setDoc).catch(() => setDoc(null))
  }, [docId, version])

  const canDocs = hasPermission('wholesale.docs')
  const canPay = hasPermission('wholesale.debts')
  const consLeft = doc?.lines.reduce((s, l) => s + l.consigned, 0) || 0
  const soldLeft = doc?.lines.reduce((s, l) => s + l.sold, 0) || 0
  const isCons = doc?.kind === 'consignment'
  const isDebit = doc?.kind === 'sale' || doc?.kind === 'cons_sale'
  const hasCost = doc?.lines.some(l => l.cost !== undefined)

  return (
    <Modal open={!!docId} onClose={onClose} size="lg" icon={FileText}
      title={doc ? <span className="flex flex-wrap items-center gap-2">{doc.no} <KindBadge kind={doc.kind} t={t} /> <PayBadge status={doc.payStatus} t={t} /></span> : '...'}
      subtitle={doc ? `${doc.clientName} · ${formatDateTime(doc.createdAt)}` : ''}
      actions={doc && <button onClick={() => printDoc(t, doc, company)} title={t('wh_print')} className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-tertiary"><Printer size={20} /></button>}
      footer={doc && (canDocs || canPay) && (
        <div className="flex flex-wrap gap-2">
          {canDocs && isCons && consLeft > 0 && <>
            <button onClick={() => setAction('settle')} className="flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 rounded-xl g-brand text-white font-bold"><CheckCircle2 size={18} />{t('wh_act_settle')}</button>
            <button onClick={() => setAction('take-back')} className="flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 rounded-xl border border-border font-bold text-text-primary hover:bg-bg-tertiary"><Undo2 size={18} />{t('wh_act_take_back')}</button>
          </>}
          {canDocs && isDebit && soldLeft > 0 && (
            <button onClick={() => setAction('return')} className="flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 rounded-xl border border-border font-bold text-text-primary hover:bg-bg-tertiary"><RotateCcw size={18} />{t('wh_act_return')}</button>
          )}
          {canPay && isDebit && doc.balance > 0 && (
            <button onClick={() => wh.pay(doc.clientId, doc.id, doc.balance)} className="flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-green text-white font-bold"><Wallet size={18} />{t('wh_accept_payment')}</button>
          )}
        </div>
      )}>
      {!doc ? <Spinner /> : (
        <div className="space-y-4">
          <DetailGrid cols={3} items={[
            { label: t('wh_f_client'), value: <button onClick={() => wh.openClient(doc.clientId)} className="text-accent-blue hover:underline text-left">{doc.clientName}</button> },
            { label: t('wh_f_warehouse'), value: doc.shopName || '—' },
            { label: t('wh_col_author'), value: doc.createdByName || '—' },
            { label: t('wh_total'), value: som(t, doc.total) },
            isDebit && { label: t('wh_col_paid'), value: som(t, doc.paid) },
            isDebit && { label: t('wh_col_balance'), value: <span className={doc.balance > 0 ? 'text-accent-red' : 'text-accent-green'}>{som(t, doc.balance)}</span> },
            doc.dueDate && { label: t('wh_due_date'), value: formatDate(doc.dueDate) },
            doc.discount > 0 && { label: t('wh_discount'), value: som(t, doc.discount) },
            doc.parentNo && { label: t('wh_parent_doc'), value: <button onClick={() => setSub(doc.parentId)} className="text-accent-blue hover:underline">{doc.parentNo}</button> },
            hasCost && isDebit && doc.costTotal !== undefined && { label: t('wh_col_profit'), value: som(t, doc.total - doc.costTotal) },
          ]} />
          {doc.notes && <p className="text-[15px] text-text-secondary bg-bg-secondary border border-border rounded-xl px-3.5 py-2.5">{doc.notes}</p>}

          <div className="bg-bg-secondary border border-border rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-tertiary">
                <tr className="text-xs font-bold text-text-muted uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">{t('wh_col_product')}</th>
                  <th className="px-4 py-3 text-right">{t('wh_col_qty')}</th>
                  <th className="px-4 py-3 text-right">{t('wh_col_price')}</th>
                  <th className="px-4 py-3 text-right">{t('wh_col_sum')}</th>
                  {isCons && <th className="px-4 py-3 text-right whitespace-nowrap">{t('wh_cons_state')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {doc.lines.map(l => (
                  <tr key={l.productId + ':' + l.price}>
                    <td className="px-4 py-3">
                      <p className="text-[15px] font-semibold text-text-primary">{l.name}</p>
                      <p className="text-sm text-text-muted flex flex-wrap items-center gap-2">{sizeOf(l.name, l.size)} <SourceBadge source={l.priceSource} t={t} /></p>
                    </td>
                    <td className="px-4 py-3 text-right text-[15px] whitespace-nowrap">{l.qty}{!isCons && isDebit && l.returned > 0 && <span className="block text-xs text-accent-red">−{l.returned} {t('wh_returned_short')}</span>}</td>
                    <td className="px-4 py-3 text-right text-[15px] whitespace-nowrap">{formatNumber(l.price)}</td>
                    <td className="px-4 py-3 text-right text-[15px] font-semibold whitespace-nowrap">{formatNumber(l.price * l.qty)}</td>
                    {isCons && (
                      <td className="px-4 py-3 text-right text-sm whitespace-nowrap">
                        <span className="text-violet-500 font-semibold">{l.consigned}</span> / <span className="text-accent-green">{l.sold}</span> / <span className="text-accent-orange">{l.returned}</span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {isCons && <p className="px-4 py-2 text-xs text-text-muted border-t border-border">{t('wh_cons_state_hint')}</p>}
          </div>

          {doc.children.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold uppercase tracking-wider text-text-muted">{t('wh_children')}</h4>
              <div className="panel px-4 divide-y divide-border">
                {doc.children.map(c => (
                  <button key={c.id} onClick={() => setSub(c.id)} className="w-full py-3 flex items-center gap-3 text-left hover:opacity-80">
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2 text-[15px] font-semibold text-text-primary">{c.no} <KindBadge kind={c.kind} t={t} /></span>
                      <span className="block text-sm text-text-muted">{formatDateTime(c.createdAt)} · {t('wh_qty_n', { n: c.qty })}</span>
                    </span>
                    <span className="text-[15px] font-bold whitespace-nowrap">{som(t, c.total)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {doc.payments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold uppercase tracking-wider text-text-muted">{t('wh_payments')}</h4>
              <div className="panel px-4 divide-y divide-border">
                {doc.payments.map(p => (
                  <div key={p.id} className="py-3 flex items-center gap-3">
                    <span className="flex-1 text-sm text-text-muted">{formatDateTime(p.createdAt)} · {methodLabel(t, p.method)}{p.createdByName ? ' · ' + p.createdByName : ''}</span>
                    <span className="text-[15px] font-bold text-accent-green whitespace-nowrap">{som(t, p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {action && doc && <LineActionModal doc={doc} mode={action} onClose={() => setAction(null)} onDone={() => setAction(null)} />}
      {sub && <DocDetailModal docId={sub} onClose={() => setSub(null)} />}
    </Modal>
  )
}

export default DocDetailModal
