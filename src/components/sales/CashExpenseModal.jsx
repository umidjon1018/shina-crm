import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowDownLeft, ArrowUpRight, Banknote, CheckCircle2, MoreHorizontal, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDataStore } from '../../store/dataStore'
import { getCashToday, addCashExpense } from '../../api/financeService'
import { useFinanceCategories } from '../../pages/Expenses/components/useFinanceCategories'
import { ICON_MAP, fmtUZS, sortedCategories, getCatLabel } from '../../pages/Expenses/components/expHelpers'
import { StackGuard } from '../ui/Modal'

const CashExpenseModal = ({ shopId, onClose }) => {
  const { t } = useTranslation()
  const { bump } = useDataStore()
  const { activeCategories, categories } = useFinanceCategories('expense')
  const [summary, setSummary] = useState(null)
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  const loadSummary = () => getCashToday(shopId).then(setSummary).catch(() => {})
  useEffect(() => { loadSummary() }, [shopId])

  const submit = async () => {
    if (!categoryId) return setError(t('exp_err_no_category'))
    if (!(Number(amount) > 0)) return setError(t('exp_err_no_amount'))
    setSaving(true); setError('')
    try {
      await addCashExpense({ shopId, categoryId, amount: Number(amount), note: note.trim() })
      setDone(t('fin_cash_saved', { amount: fmtUZS(Number(amount)) }))
      setAmount(''); setNote(''); setCategoryId('')
      loadSummary()
      bump()
    } catch (e) {
      setError(e?.response?.data?.error || t('exp_err_generic'))
    } finally {
      setSaving(false)
    }
  }

  const catLabel = (id) => getCatLabel(categories.find(c => c.id === id), t)

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <StackGuard onClose={onClose} />
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-md shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border sticky top-0 bg-bg-secondary z-10">
          <h3 className="font-syne font-bold text-lg text-text-primary flex items-center gap-2"><Banknote size={18} className="text-accent-orange" /> {t('fin_cash_title')}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-bg-tertiary rounded-lg"><X size={18} className="text-text-secondary" /></button>
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          {summary && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-bg-tertiary rounded-xl p-2.5">
                <p className="text-text-muted text-[11px] flex items-center justify-center gap-1"><ArrowDownLeft size={11} /> {t('fin_cash_in_today')}</p>
                <p className="text-accent-green font-bold text-sm mt-0.5">{fmtUZS(summary.in)}</p>
              </div>
              <div className="bg-bg-tertiary rounded-xl p-2.5">
                <p className="text-text-muted text-[11px] flex items-center justify-center gap-1"><ArrowUpRight size={11} /> {t('fin_cash_out_today')}</p>
                <p className="text-accent-red font-bold text-sm mt-0.5">{fmtUZS(summary.out)}</p>
              </div>
              <div className="bg-bg-tertiary rounded-xl p-2.5">
                <p className="text-text-muted text-[11px]">{t('fin_cash_net_today')}</p>
                <p className="text-text-primary font-bold text-sm mt-0.5">{fmtUZS(summary.net)}</p>
              </div>
            </div>
          )}

          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('col_category')}</label>
            <div className="grid grid-cols-3 gap-2">
              {sortedCategories(activeCategories).map(cat => {
                const Icon = ICON_MAP[cat.icon] || MoreHorizontal
                const active = categoryId === cat.id
                return (
                  <button key={cat.id} onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-medium text-left transition-all
                      ${active ? 'border-accent-red bg-accent-red/10 text-accent-red' : 'border-border bg-bg-tertiary text-text-secondary hover:border-accent-red/50'}`}>
                    <Icon size={13} className="shrink-0" /><span className="truncate">{getCatLabel(cat, t)}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('fin_cash_amount')}</label>
            <input type="number" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red" />
          </div>
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('col_note')}</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder={t('fin_cash_note_ph')}
              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red" />
          </div>
          {error && <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg"><AlertCircle size={15} /> {error}</div>}
          {done && <div className="flex items-center gap-2 text-accent-green text-sm bg-accent-green/10 px-3 py-2 rounded-lg"><CheckCircle2 size={15} /> {done}</div>}

          <button onClick={submit} disabled={saving}
            className="w-full py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50">
            {saving ? t('exp_form_saving') : t('fin_cash_submit')}
          </button>

          {summary?.expenses?.length > 0 && (
            <div>
              <p className="text-text-secondary text-xs font-semibold mb-2">{t('fin_cash_today_list')}</p>
              <div className="space-y-1.5">
                {summary.expenses.map(e => (
                  <div key={e.id} className="flex items-center justify-between gap-2 text-xs bg-bg-tertiary rounded-lg px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-text-primary font-medium truncate">{catLabel(e.category_id)}{e.note ? ` · ${e.note}` : ''}</p>
                      <p className="text-text-muted">{e.responsible_name || '—'}</p>
                    </div>
                    <span className="text-accent-red font-semibold whitespace-nowrap">−{fmtUZS(Number(e.amount_uzs || e.amount))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default CashExpenseModal
