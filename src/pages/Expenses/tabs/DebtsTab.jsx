import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { HandCoins, Truck, Building2, User, ArrowRight, Boxes } from 'lucide-react'
import { useShopStore } from '../../../store/shopStore'
import { useDataStore } from '../../../store/dataStore'
import { getDebts } from '../../../api/financeService'
import Modal from '../../../components/ui/Modal'
import { Badge, DetailGrid } from '../../../components/ui/Kit'
import { HeroStat, ChartCard } from '../../../components/charts/Charts'
import { formatNumber, formatUSD, formatDate } from '../../../utils/format'

// Qarzlar: bizga qarzdorlar (muddatli sotuvlar — nasiya tashkilotlari va mijozlar) va biz qarzdor bo'lgan yetkazib beruvchilar
const DebtsTab = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { selectedShopId } = useShopStore()
  const { version } = useDataStore()
  const [data, setData] = useState(null)
  const [open, setOpen] = useState(null)

  useEffect(() => { getDebts(selectedShopId).then(setData).catch(() => setData({ receivable: [], payable: [], totals: {} })) }, [selectedShopId, version])

  if (!data) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" /></div>
  const som = t('unit_som')
  const tot = data.totals || {}
  const groupIcon = (g) => (g?.type === 'org' ? Building2 : g?.type === 'wholesale' ? Boxes : User)
  const groupKind = (g) => (g?.type === 'org' ? t('fin_debt_org') : g?.type === 'wholesale' ? t('fin_debt_wholesale') : null)
  const payLink = (g) => (g?.type === 'wholesale' ? '/wholesale?section=debts' : '/sales?section=installment')

  const Row = ({ icon: Icon, name, sub, amount, overdue, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 py-3 text-left hover:bg-bg-tertiary/40 rounded-xl px-2 -mx-2 transition-colors">
      <span className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center text-text-secondary shrink-0"><Icon size={19} /></span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-semibold text-text-primary truncate">{name}</span>
        <span className="block text-sm text-text-muted truncate">{sub}</span>
      </span>
      <span className="text-right shrink-0">
        <span className="block text-[15px] font-bold text-text-primary whitespace-nowrap">{amount}</span>
        {overdue && <span className="block text-sm font-semibold text-accent-red whitespace-nowrap">{overdue}</span>}
      </span>
    </button>
  )

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <HeroStat gradient="cyan" icon={HandCoins} label={t('fin_debt_receivable')} value={formatNumber(tot.receivable)} unit={som}
          sub={`${t('fin_debt_overdue')}: ${formatNumber(tot.receivableOverdue)}`} />
        <HeroStat gradient="orange" icon={Truck} label={t('fin_debt_payable')} value={formatUSD(tot.payableUSD)}
          sub={`${t('fin_debt_overdue')}: ${formatUSD(tot.payableOverdueUSD)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <ChartCard title={t('fin_debt_receivable')} subtitle={t('fin_debt_receivable_sub')}
          right={<button onClick={() => navigate('/sales?section=installment')} className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary">{t('fin_debt_to_installments')} <ArrowRight size={15} /></button>}>
          <div className="divide-y divide-border">
            {data.receivable.map(g => (
              <Row key={g.id} icon={groupIcon(g)} name={g.name}
                sub={`${groupKind(g) || g.phone || t('fin_debt_customer')} · ${t('fin_debt_docs', { n: g.docs.length })}${g.nextDue ? ' · ' + formatDate(g.nextDue) : ''}`}
                amount={`${formatNumber(g.debt)} ${som}`} overdue={g.overdue > 0 ? `${t('fin_debt_overdue')}: ${formatNumber(g.overdue)}` : null}
                onClick={() => setOpen(g)} />
            ))}
            {!data.receivable.length && <p className="text-[15px] text-text-muted text-center py-10">{t('fin_debt_none')}</p>}
          </div>
        </ChartCard>

        <ChartCard title={t('fin_debt_payable')} subtitle={t('fin_debt_payable_sub')}
          right={<button onClick={() => navigate('/income?section=debts')} className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary">{t('fin_debt_to_income')} <ArrowRight size={15} /></button>}>
          <div className="divide-y divide-border">
            {data.payable.map(s => (
              <Row key={s.id} icon={Truck} name={s.name}
                sub={`${t('fin_debt_batches', { n: s.count })}${s.nextDue ? ' · ' + formatDate(s.nextDue) : ''}`}
                amount={formatUSD(s.debtUSD)} overdue={s.overdueUSD > 0 ? `${t('fin_debt_overdue')}: ${formatUSD(s.overdueUSD)}` : null}
                onClick={() => navigate('/income?section=debts')} />
            ))}
            {!data.payable.length && <p className="text-[15px] text-text-muted text-center py-10">{t('fin_debt_none')}</p>}
          </div>
        </ChartCard>
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} size="lg" icon={groupIcon(open)}
        title={open?.name} subtitle={[groupKind(open), open?.type !== 'org' ? open?.phone : null].filter(Boolean).join(' · ')}
        footer={<button onClick={() => navigate(payLink(open))} className="w-full py-3 rounded-xl g-brand text-white font-bold">{t('fin_debt_accept_payment')}</button>}>
        {open && (
          <div className="space-y-4">
            <DetailGrid cols={3} items={[
              { label: t('fin_debt_total'), value: `${formatNumber(open.debt)} ${som}` },
              { label: t('fin_debt_overdue'), value: open.overdue > 0 ? <span className="text-accent-red">{formatNumber(open.overdue)} {som}</span> : '—' },
              { label: t('fin_debt_next_due'), value: open.nextDue ? formatDate(open.nextDue) : '—' },
            ]} />
            <div className="panel px-4 divide-y divide-border">
              {open.docs.map(d => (
                <div key={d.kind + d.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-text-primary truncate">
                      {d.no || `#${d.id}`} {d.kind === 'used_sale' && <Badge color="bg-accent-orange/10 text-accent-orange">B/U</Badge>} {d.customer && open.type === 'org' ? `· ${d.customer}` : ''}
                    </p>
                    <p className="text-sm text-text-muted">{formatDate(d.date)} → {d.due ? formatDate(d.due) : '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[15px] font-bold whitespace-nowrap">{formatNumber(d.debt)} {som}</p>
                    {d.overdue && <Badge color="bg-accent-red/10 text-accent-red">{t('fin_debt_overdue')}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default DebtsTab
