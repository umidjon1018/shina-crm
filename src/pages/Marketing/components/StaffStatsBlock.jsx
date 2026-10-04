import React, { useState, useEffect } from 'react'
import { BarChart3, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getTgStaff, saveTgStaff, removeTgStaff } from '../../../api/reportService'
import { fmtDT } from './mkHelpers'

const StaffStatsBlock = () => {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [msg, setMsg] = useState('')

  const load = () => getTgStaff().then(setData).catch(() => setData(null))
  useEffect(() => { load() }, [])
  if (!data) return null

  const saveDaily = async (patch) => {
    const dailyReport = { ...data.dailyReport, ...patch }
    setData(d => ({ ...d, dailyReport }))
    try { await saveTgStaff({ dailyReport }); setMsg(t('mkt_set_saved')) } catch { setMsg(t('exp_err_generic')) }
  }
  const remove = async (chatId) => {
    if (!window.confirm(t('rpt_tg_remove_confirm'))) return
    await removeTgStaff(chatId); load()
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-2xl p-4 space-y-4">
      <h3 className="font-syne font-bold text-text-primary flex items-center gap-2"><BarChart3 size={17} className="text-accent-green" /> {t('rpt_tg_staff_title')}</h3>
      <p className="text-xs text-text-muted">{t('rpt_tg_staff_hint')}</p>
      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <input type="checkbox" checked={data.dailyReport.enabled} onChange={e => saveDaily({ enabled: e.target.checked })} className="w-4 h-4 accent-[#E63946]" />
          {t('rpt_tg_daily')}
        </label>
        <select value={data.dailyReport.hour} onChange={e => saveDaily({ hour: Number(e.target.value) })}
          className="bg-bg-tertiary border border-border rounded-xl px-3 py-2 text-sm text-text-primary">
          {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
        </select>
        {msg && <span className="text-xs text-accent-green">{msg}</span>}
      </div>
      <div className="divide-y divide-border/50 rounded-xl border border-border">
        {data.staff.length === 0 && <p className="px-3 py-4 text-xs text-text-muted text-center">{t('rpt_tg_staff_empty')}</p>}
        {data.staff.map(s => (
          <div key={s.chatId} className="flex items-center gap-3 px-3 py-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">{s.name}</p>
              <p className="text-[11px] text-text-muted">{s.role} · {fmtDT(s.linkedAt)}</p>
            </div>
            <button onClick={() => remove(s.chatId)} className="p-1.5 rounded-lg text-text-secondary hover:text-accent-red"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StaffStatsBlock
