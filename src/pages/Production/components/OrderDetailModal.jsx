import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Factory, Play, CheckCircle2, XCircle } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import DateMaskInput from '../../../components/DateMaskInput'
import { DetailGrid } from '../../../components/ui/Kit'
import { toast, errorText } from '../../../components/ui/Toast'
import { useAuthStore } from '../../../store/authStore'
import { useDataStore } from '../../../store/dataStore'
import { getProdOrder, startProdOrder, completeProdOrder, cancelProdOrder } from '../../../api/productionService'
import { formatNumber, formatDate, formatDateTime } from '../../../utils/format'
import { StatusBadge, Spinner, inputCls, labelCls, fmtQty, qtyUnit, CostsEditor, usePr } from './prHelpers'

const n = (v) => Number(v) || 0
const r3 = (v) => Math.round(n(v) * 1000) / 1000

// Ishlab chiqarishni yakunlash: yaroqli va brak miqdori, haqiqiy xomashyo sarfi, xarajatlar, partiya va muddat
const CompleteModal = ({ order, onClose, onDone }) => {
  const { t } = useTranslation()
  const { bump } = useDataStore()
  const hasCost = order.costPlan !== undefined
  const [produced, setProduced] = useState(String(order.plannedQty))
  const [defect, setDefect] = useState('')
  const [cons, setCons] = useState(null)
  const [costs, setCosts] = useState(null)
  const [lotNo, setLotNo] = useState('')
  const [date, setDate] = useState('')
  const [expires, setExpires] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  // Qo'lda o'zgartirilmaguncha sarf va xarajatlar miqdorga mos hisoblanadi
  const k = (n(produced) + n(defect)) / (order.plannedQty || 1)
  const autoCons = order.materials.filter(m => m.plannedQty > 0).map(m => ({ productId: m.productId, name: m.name, unit: m.unit, qty: String(r3(m.plannedQty * k)), available: m.available }))
  const autoCosts = (order.costPlan || []).map(c => ({ name: c.name, amount: String(Math.round(n(c.amount) * n(produced))) }))
  const curCons = cons || autoCons
  const curCosts = costs || autoCosts
  const short = curCons.some(c => n(c.qty) > c.available + 0.0005)

  const submit = async () => {
    setErr('')
    if (!(n(produced) > 0)) return setErr(t('pr_err_qty'))
    setSaving(true)
    try {
      const body = { produced_qty: n(produced), defect_qty: n(defect), consumption: curCons.map(c => ({ product_id: c.productId, qty: n(c.qty) })),
        lot_no: lotNo || undefined, produced_at: date || undefined, expires_at: expires || undefined, notes: notes || undefined }
      if (hasCost) body.costs = curCosts.filter(c => c.name && n(c.amount) > 0).map(c => ({ name: c.name, amount: n(c.amount) }))
      const res = await completeProdOrder(order.id, body)
      toast(hasCost ? t('pr_done_cost', { cost: formatNumber(res.unitCost), unit: order.unit }) : t('pr_done'))
      bump()
      onDone?.()
    } catch (e) { setErr(errorText(e, t('exp_err_generic'))) } finally { setSaving(false) }
  }

  return (
    <Modal open onClose={onClose} size="lg" icon={CheckCircle2} title={t('pr_complete')} subtitle={`${order.no} · ${order.productName}`}
      footer={
        <div className="space-y-2">
          {err && <div className="text-sm text-accent-red bg-accent-red/10 px-3 py-2.5 rounded-xl">{err}</div>}
          <button onClick={submit} disabled={saving} className="w-full py-3 rounded-xl g-brand text-white font-bold disabled:opacity-50">{saving ? '...' : t('pr_confirm_done')}</button>
        </div>
      }>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{t('pr_f_produced')} ({order.unit}) *</label>
            <input type="number" min="0" step={order.productMode === 'serial' ? 1 : 'any'} value={produced} onChange={e => setProduced(e.target.value)} className={inputCls + ' text-lg font-bold'} />
          </div>
          <div>
            <label className={labelCls}>{t('pr_f_defect')} ({order.unit})</label>
            <input type="number" min="0" step="any" value={defect} onChange={e => setDefect(e.target.value)} placeholder="0" className={inputCls} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-text-muted">{t('pr_actual_consumption')}</h4>
            {cons && <button onClick={() => setCons(null)} className="text-sm text-accent-blue hover:underline">{t('pr_recalc')}</button>}
          </div>
          <div className="panel divide-y divide-border">
            {curCons.map((c, i) => (
              <div key={c.productId} className="p-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[160px]">
                  <p className="text-[15px] font-semibold text-text-primary">{c.name}</p>
                  <p className={`text-sm ${n(c.qty) > c.available + 0.0005 ? 'text-accent-red' : 'text-text-muted'}`}>{t('pr_col_have')}: {qtyUnit(c.available, c.unit)}</p>
                </div>
                <div className="relative w-40">
                  <input type="number" min="0" step="any" value={c.qty} onChange={e => setCons(curCons.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)))}
                    className={inputCls + ' pr-12 text-right font-semibold'} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">{c.unit}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted">{t('pr_consumption_hint')}</p>
          {short && <p className="text-sm text-accent-red">{t('pr_short_warn')}</p>}
        </div>

        {hasCost && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold uppercase tracking-wider text-text-muted">{t('pr_extra_costs')}</h4>
              {costs && <button onClick={() => setCosts(null)} className="text-sm text-accent-blue hover:underline">{t('pr_recalc')}</button>}
            </div>
            <CostsEditor value={curCosts} onChange={setCosts} t={t} hint={t('pr_costs_total_hint')} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>{t('pr_f_lot')}</label>
            <input value={lotNo} onChange={e => setLotNo(e.target.value)} placeholder={order.no} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t('pr_f_produced_at')}</label>
            <DateMaskInput value={date} onChange={e => setDate(e.target.value)} placeholder={t('pr_today')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t('pr_f_expires')}</label>
            <DateMaskInput value={expires} onChange={e => setExpires(e.target.value)} placeholder={t('pr_auto')} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>{t('pr_f_notes')}</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} />
        </div>
      </div>
    </Modal>
  )
}

// Buyurtma: reja va haqiqiy sarf, tannarx, tayyor mahsulot partiyasi, amallar
const OrderDetailModal = ({ orderId, onClose }) => {
  const { t } = useTranslation()
  const { version, bump } = useDataStore()
  const hasPermission = useAuthStore(s => s.hasPermission)
  const pr = usePr()
  const [o, setO] = useState(null)
  const [completing, setCompleting] = useState(false)

  useEffect(() => { getProdOrder(orderId).then(setO).catch(() => setO(null)) }, [orderId, version])

  const act = async (fn, msg, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return
    try { await fn(o.id); toast(msg); bump() } catch (e) { toast(errorText(e, t('exp_err_generic')), 'error') }
  }
  const canAct = hasPermission('production.orders') && o && ['planned', 'in_progress'].includes(o.status)
  const done = o?.status === 'done'
  const hasCost = o?.unitCost !== undefined

  return (
    <Modal open onClose={onClose} size="lg" icon={Factory}
      title={o ? <span className="flex flex-wrap items-center gap-2">{o.no} <StatusBadge status={o.status} t={t} /></span> : '...'}
      subtitle={o ? `${o.productName} · ${qtyUnit(done ? o.producedQty : o.plannedQty, o.unit)}` : ''}
      footer={canAct && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCompleting(true)} className="flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 rounded-xl g-brand text-white font-bold"><CheckCircle2 size={18} />{t('pr_complete')}</button>
          {o.status === 'planned' && (
            <button onClick={() => act(startProdOrder, t('pr_started'))} className="flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 rounded-xl border border-border font-bold text-text-primary hover:bg-bg-tertiary"><Play size={18} />{t('pr_start')}</button>
          )}
          <button onClick={() => act(cancelProdOrder, t('pr_cancelled'), t('pr_cancel_confirm'))} className="flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 rounded-xl border border-border font-bold text-accent-red hover:bg-accent-red/10"><XCircle size={18} />{t('pr_cancel')}</button>
        </div>
      )}>
      {!o ? <Spinner /> : (
        <div className="space-y-4">
          <DetailGrid cols={3} items={[
            { label: t('pr_col_product'), value: o.productName },
            { label: t('pr_f_planned'), value: qtyUnit(o.plannedQty, o.unit) },
            done && { label: t('pr_f_produced'), value: <span>{qtyUnit(o.producedQty, o.unit)}{o.defectQty > 0 && <span className="text-accent-red text-sm"> · {t('pr_defect_short')} {fmtQty(o.defectQty)}</span>}</span> },
            { label: t('pr_f_sex'), value: o.shopName || '—' },
            o.outputShopId !== o.shopId && { label: t('pr_f_output_shop'), value: o.outputShopName },
            o.recipeId && { label: t('pr_f_recipe'), value: `${o.recipeName || t('pr_recipe')} · v${o.recipeVersion}` },
            o.plannedDate && { label: t('pr_f_date'), value: formatDate(o.plannedDate) },
            done && { label: t('pr_f_produced_at'), value: formatDate(o.producedAt) },
            done && o.lotNo && { label: t('pr_f_lot'), value: o.lotNo },
            done && o.expiresAt && { label: t('pr_f_expires'), value: formatDate(o.expiresAt) },
            done && hasCost && { label: t('pr_col_unit_cost'), value: <b>{formatNumber(o.unitCost)} {t('unit_som')} / {o.unit}</b> },
            done && hasCost && { label: t('pr_col_total_cost'), value: `${formatNumber(o.totalCost)} ${t('unit_som')}` },
            { label: t('pr_col_author'), value: `${o.createdByName || '—'} · ${formatDateTime(o.createdAt)}` },
            o.finishedAt && { label: o.status === 'cancelled' ? t('pr_status_cancelled') : t('pr_status_done'), value: `${o.finishedByName || '—'} · ${formatDateTime(o.finishedAt)}` },
          ]} />
          {o.notes && <p className="text-[15px] text-text-secondary bg-bg-secondary border border-border rounded-xl px-3.5 py-2.5">{o.notes}</p>}

          <div className="bg-bg-secondary border border-border rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-tertiary">
                <tr className="text-xs font-bold text-text-muted uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">{t('pr_f_material')}</th>
                  <th className="px-4 py-3 text-right">{t('pr_col_plan')}</th>
                  <th className="px-4 py-3 text-right">{done ? t('pr_col_fact') : t('pr_col_have')}</th>
                  {done && hasCost && <th className="px-4 py-3 text-right">{t('pr_col_cost')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-[15px]">
                {o.materials.map(m => {
                  const val = done ? m.actualQty : m.available
                  const bad = done ? false : m.plannedQty > m.available + 0.0005
                  return (
                    <tr key={m.productId}>
                      <td className="px-4 py-2.5"><button onClick={() => pr.openMaterial(m.productId)} className="text-left hover:underline">{m.name}</button></td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">{qtyUnit(m.plannedQty, m.unit)}</td>
                      <td className={`px-4 py-2.5 text-right whitespace-nowrap font-semibold ${bad ? 'text-accent-red' : ''}`}>{val === null ? '—' : qtyUnit(val, m.unit)}</td>
                      {done && hasCost && <td className="px-4 py-2.5 text-right whitespace-nowrap">{m.cost === null ? '—' : formatNumber(m.cost)}</td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {done && hasCost && (o.costs || []).length > 0 && (
            <div className="panel px-4 divide-y divide-border">
              <p className="py-2.5 text-sm font-bold uppercase tracking-wider text-text-muted">{t('pr_extra_costs')}</p>
              {o.costs.map((c, i) => (
                <div key={i} className="py-2.5 flex justify-between text-[15px]"><span>{c.name}</span><b>{formatNumber(c.amount)}</b></div>
              ))}
              <div className="py-2.5 flex justify-between text-[15px]"><span className="text-text-muted">{t('pr_col_material_cost')}</span><b>{formatNumber(o.materialCost)}</b></div>
            </div>
          )}

          {o.output && (
            <div className="panel p-4 space-y-1">
              <p className="text-sm text-text-muted">{t('pr_output')}</p>
              <p className="text-[15px] font-semibold">{o.output.type === 'batch' ? o.output.batchNumber : o.output.lotNo} · {t('pr_output_in_stock', { n: fmtQty(o.output.inStock), total: fmtQty(o.output.qty), unit: o.unit })}</p>
              {o.output.noBarcode > 0 && <p className="text-sm text-accent-orange">{t('pr_output_no_barcode', { n: o.output.noBarcode })}</p>}
            </div>
          )}
        </div>
      )}
      {completing && o && <CompleteModal order={o} onClose={() => setCompleting(false)} onDone={() => setCompleting(false)} />}
    </Modal>
  )
}

export default OrderDetailModal
