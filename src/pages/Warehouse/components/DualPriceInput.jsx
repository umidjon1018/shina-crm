import React, { useState, useEffect } from 'react'

const toText = (uzs, cur, rate) => {
  if (uzs === '' || uzs == null) return ''
  if (cur === 'usd') return rate > 0 ? String(Math.round((uzs / rate) * 100) / 100) : ''
  return String(uzs)
}

// Narx maydoni: so'm yoki USD da kiritiladi, saqlash uchun doim so'm qiymati yashirin inputda (id) turadi
const DualPriceInput = ({ id, defaultUzs, cur, rate, className, som }) => {
  const [uzs, setUzs] = useState(defaultUzs ? Number(defaultUzs) : '')
  const [text, setText] = useState(toText(defaultUzs || '', cur, rate))

  useEffect(() => { setText(toText(uzs, cur, rate)) }, [cur, rate])

  const onChange = (v) => {
    setText(v)
    if (v === '') { setUzs(''); return }
    const n = Number(v)
    if (Number.isNaN(n)) return
    setUzs(cur === 'usd' ? Math.round(n * (rate || 0)) : n)
  }

  const hint = uzs === '' ? null
    : cur === 'usd' ? `≈ ${Number(uzs).toLocaleString('uz-UZ')} ${som}`
    : rate > 0 ? `≈ $${(Math.round((uzs / rate) * 100) / 100).toLocaleString('uz-UZ')}` : null

  return (
    <>
      <div className="relative">
        {cur === 'usd' && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>}
        <input type="number" step={cur === 'usd' ? '0.01' : '1'} min="0" value={text} onChange={e => onChange(e.target.value)}
          className={`${className} ${cur === 'usd' ? 'pl-8' : ''}`} />
      </div>
      <input type="hidden" id={id} value={uzs} readOnly />
      {hint && <p className="text-[10px] text-text-muted mt-1">{hint}</p>}
    </>
  )
}

export default DualPriceInput
