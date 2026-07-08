import React, { useState, useEffect, useMemo } from 'react'
import DateMaskInput from '../../../components/DateMaskInput'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Building2, Megaphone, Monitor, MoreHorizontal, Sparkles, Store, Truck, Users, Wallet, Wrench, X, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../../store/authStore'
import { useShopStore } from '../../../store/shopStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { addExpense, updateExpense } from '../../../api/expenseService'
import { ICON_MAP, fmtUZS, today, sortedCategories, getCatLabel } from './expHelpers'

// ─── EXPENSE FORM MODAL (qo'shish + tahrirlash) ──────────
const ExpenseFormModal = ({ onClose, onSave, categories, currentUser, editData, shops, defaultShopId }) => {
  const { t } = useTranslation()
  const isEdit = !!editData
  const { employees } = useSettingsStore()
  const [form, setForm] = useState(isEdit ? {
    categoryId: editData.categoryId,
    amount: String(editData.amount),
    currency: editData.currency,
    usdRate: editData.usdRate ? String(editData.usdRate) : '12700',
    date: editData.date,
    period: editData.period || '',
    responsibleName: editData.responsibleName,
    note: editData.note || '',
    shopId: editData.shopId || 'shop1',
    expenseType: editData.expenseType || 'fixed',
    employeeId: editData.employeeId || '',
  } : {
    categoryId: categories[0]?.id || '',
    amount: '',
    currency: 'UZS',
    usdRate: '12700',
    date: today(),
    period: '',
    responsibleName: currentUser.name,
    note: '',
    shopId: defaultShopId || shops[0]?.id || 'shop1',
    expenseType: 'fixed',
    employeeId: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const isSalaryCategory = categories.find(c => c.id === form.categoryId)?.key === 'salary'

  const handleSelectEmployee = (empId) => {
    const emp = employees.find(e => e.id === empId)
    setForm(f => ({
      ...f,
      employeeId: empId,
      amount: emp ? String(emp.salary) : f.amount,
      currency: 'UZS',
    }))
  }

  const amountUZS = useMemo(() => {
    if (!form.amount) return 0
    if (form.currency === 'UZS') return Number(form.amount)
    return Number(form.amount) * Number(form.usdRate || 0)
  }, [form.amount, form.currency, form.usdRate])

  const handleSubmit = async () => {
    if (!form.categoryId) return setError(t('exp_err_no_category'))
    if (!form.amount || Number(form.amount) <= 0) return setError(t('exp_err_no_amount'))
    if (form.currency === 'USD' && Number(form.usdRate) <= 0) return setError(t('exp_err_no_usd_rate'))
    if (!form.date) return setError(t('exp_err_no_date'))
    setLoading(true); setError('')
    const payload = {
      categoryId: form.categoryId,
      amount: Number(form.amount),
      currency: form.currency,
      usdRate: form.currency === 'USD' ? Number(form.usdRate) : null,
      amountUZS,
      date: form.date,
      period: form.period || null,
      responsibleId: currentUser.id,
      responsibleName: form.responsibleName,
      note: form.note.trim(),
      shopId: form.shopId,
      expenseType: form.expenseType,
      employeeId: isSalaryCategory ? (form.employeeId || null) : null,
    }
    let res
    if (isEdit) res = await updateExpense(editData.id, payload)
    else res = await addExpense(payload)
    setLoading(false)
    if (res.success) { onSave(res.expense || { ...editData, ...payload }); onClose() }
    else setError(t('exp_err_generic'))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-md shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-bg-secondary">
          <h3 className="font-syne font-bold text-lg text-text-primary">
            {isEdit ? t('exp_form_edit_title') : t('exp_form_add_title')}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors">
            <X size={18} className="text-text-secondary" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Kategoriya */}
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('col_category')}</label>
            <div className="grid grid-cols-3 gap-2">
              {sortedCategories(categories).map(cat => {
                const Icon = ICON_MAP[cat.icon] || MoreHorizontal
                const active = form.categoryId === cat.id
                return (
                  <button key={cat.id} onClick={() => set('categoryId', cat.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-xs font-medium text-left
                      ${active ? 'border-accent-red bg-accent-red/10 text-accent-red' : 'border-border bg-bg-tertiary text-text-secondary hover:border-accent-red/50'}`}>
                    <Icon size={14} className="shrink-0" />
                    <span className="truncate">{getCatLabel(cat, t)}</span>
                  </button>
                )
              })}
            </div>
          </div>
          {/* Xarajat turi */}
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('exp_form_expense_type')}</label>
            <div className="flex gap-2">
              {[
                { value: 'fixed', label: t('exp_form_fixed_label'), desc: t('exp_form_fixed_desc'), cls: 'text-accent-blue', bg: 'bg-accent-blue/10 border-accent-blue' },
                { value: 'variable', label: t('exp_form_variable_label'), desc: t('exp_form_variable_desc'), cls: 'text-accent-orange', bg: 'bg-accent-orange/10 border-accent-orange' },
              ].map(opt => (
                <button key={opt.value} onClick={() => set('expenseType', opt.value)}
                  className={`flex-1 flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl border transition-all
                    ${form.expenseType === opt.value ? `${opt.bg} ${opt.cls}` : 'border-border bg-bg-tertiary text-text-secondary hover:border-accent-red/50'}`}>
                  <span className="text-sm font-semibold">{opt.label}</span>
                  <span className="text-xs opacity-70">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Xodim (faqat Ish haqi kategoriyasida) */}
          {isSalaryCategory && (
            <div>
              <label className="text-text-secondary text-sm mb-1.5 block">{t('col_employee')}</label>
              <select value={form.employeeId} onChange={e => handleSelectEmployee(e.target.value)}
                className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red">
                <option value="">{t('exp_form_employee_none')}</option>
                {employees.filter(e => e.isActive).map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
              {form.employeeId && (
                <p className="text-text-secondary text-xs mt-1">
                  {t('exp_form_salary_hint')}
                </p>
              )}
            </div>
          )}
          {/* Summa + Valyuta */}
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('col_amount')}</label>
            <div className="flex gap-2">
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0"
                className="flex-1 bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red" />
              <div className="flex border border-border rounded-xl overflow-hidden">
                {['UZS','USD'].map(cur => (
                  <button key={cur} onClick={() => set('currency', cur)}
                    className={`px-3 py-2 text-sm font-semibold transition-colors
                      ${form.currency === cur ? 'bg-accent-red text-white' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'}`}>
                    {cur}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* USD kurs */}
          {form.currency === 'USD' && (
            <div>
              <label className="text-text-secondary text-sm mb-1.5 block">{t('exp_form_usd_rate')}</label>
              <input type="number" value={form.usdRate} onChange={e => set('usdRate', e.target.value)}
                className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red" />
              {amountUZS > 0 && <p className="text-text-secondary text-xs mt-1">≈ {fmtUZS(amountUZS)}</p>}
            </div>
          )}
          {/* Sana */}
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('exp_form_pay_date')}</label>
            <DateMaskInput value={form.date} onChange={e => set('date', e.target.value)}
              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red" />
          </div>
          {/* Davr (ixtiyoriy) */}
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">
              {t('exp_form_period')} <span className="text-text-secondary opacity-60">{t('exp_form_period_optional')}</span>
            </label>
            <input type="month" value={form.period} onChange={e => set('period', e.target.value)}
              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red" />
            <p className="text-text-secondary text-xs mt-1">{t('exp_form_period_hint')}</p>
          </div>
          {/* Mas'ul */}
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('exp_form_responsible')}</label>
            <input type="text" value={form.responsibleName} onChange={e => set('responsibleName', e.target.value)}
              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red" />
          </div>
          {/* Do'kon */}
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('exp_form_shop')}</label>
            <div className="grid grid-cols-1 gap-2">
              {shops.map(shop => (
                <button
                  key={shop.id}
                  onClick={() => set('shopId', shop.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-sm font-medium text-left
                    ${form.shopId === shop.id
                      ? 'border-accent-red bg-accent-red/10 text-accent-red'
                      : 'border-border bg-bg-tertiary text-text-secondary hover:border-accent-red/50'
                    } ${!shop.isActive ? 'opacity-50' : ''}`}
                >
                  <Store size={14} className="shrink-0" />
                  <span className="flex-1 truncate">{shop.name}</span>
                  {!shop.isActive && <span className="text-xs opacity-60">{t('exp_form_shop_inactive')}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Izoh */}
          <div>
            <label className="text-text-secondary text-sm mb-1.5 block">{t('col_note')}</label>
            <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={2} placeholder={t('exp_form_note_placeholder')}
              className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-red resize-none" />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg">
              <AlertCircle size={15} /> {error}
            </div>
          )}
        </div>
        <div className="flex gap-3 p-5 border-t border-border sticky bottom-0 bg-bg-secondary">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-bg-tertiary transition-colors text-sm font-medium">{t('cancel')}</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-accent-red text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? t('exp_form_saving') : isEdit ? t('save') : t('add')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}


export default ExpenseFormModal
