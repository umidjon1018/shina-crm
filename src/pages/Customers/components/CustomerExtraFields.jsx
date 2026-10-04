import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

const inputCls = 'w-full px-4 py-3 bg-bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-accent-red'
const labelCls = 'text-[10px] font-extrabold uppercase tracking-widest text-text-muted'

// Mijoz formasi uchun qo'shimcha maydonlar: jins, manzil, email, guruh, teglar
const CustomerExtraFields = ({ form, setForm, groups = [], allTags = [] }) => {
  const { t } = useTranslation()
  const [tagInput, setTagInput] = useState('')
  const tags = form.tags || []

  const addTag = (raw) => {
    const v = String(raw || '').trim()
    if (!v || tags.some(x => x.toLowerCase() === v.toLowerCase())) { setTagInput(''); return }
    setForm({ ...form, tags: [...tags, v] })
    setTagInput('')
  }
  const suggestions = allTags.filter(x => !tags.includes(x) && (!tagInput || x.toLowerCase().includes(tagInput.toLowerCase()))).slice(0, 8)

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={labelCls}>{t('cust_field_gender')}</label>
          <select value={form.gender || ''} onChange={e => setForm({ ...form, gender: e.target.value })} className={inputCls}>
            <option value="">—</option>
            <option value="male">{t('cust_gender_male')}</option>
            <option value="female">{t('cust_gender_female')}</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>{t('cust_field_group')}</label>
          <input list="cust-groups" value={form.group || ''} onChange={e => setForm({ ...form, group: e.target.value })}
            placeholder={t('cust_field_group_ph')} className={inputCls} />
          <datalist id="cust-groups">{groups.map(g => <option key={g} value={g} />)}</datalist>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className={labelCls}>{t('cust_field_address')}</label>
        <input value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} className={inputCls} />
      </div>
      <div className="space-y-1.5">
        <label className={labelCls}>Email</label>
        <input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="mail@example.com" className={inputCls} />
      </div>
      <div className="space-y-1.5">
        <label className={labelCls}>{t('cust_field_tags')}</label>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tg => (
              <span key={tg} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-accent-blue/10 text-accent-blue text-xs font-bold">
                #{tg}
                <button type="button" onClick={() => setForm({ ...form, tags: tags.filter(x => x !== tg) })}><X size={12} /></button>
              </span>
            ))}
          </div>
        )}
        <input
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) } }}
          onBlur={() => tagInput.trim() && addTag(tagInput)}
          placeholder={t('cust_field_tags_ph')}
          className={inputCls}
        />
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map(s => (
              <button type="button" key={s} onMouseDown={e => e.preventDefault()} onClick={() => addTag(s)}
                className="px-2 py-0.5 rounded-lg border border-border text-[11px] text-text-muted hover:text-text-primary hover:border-text-muted">
                + {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default CustomerExtraFields
