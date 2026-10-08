import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../../../store/settingsStore'
import EditReturnModal from '../../../components/sales/EditReturnModal'
import Modal from '../../../components/ui/Modal'
import MonthRangeSelect from '../../../components/ui/MonthRangeSelect'
import DataTable from '../../../components/ui/DataTable'
import { Badge, DetailGrid } from '../../../components/ui/Kit'
import { formatNumber, formatDateTime } from '../../../utils/format'

const dt = formatDateTime

// Bekor va almashtirishlar tarixi: ixcham ro'yxat, qator bosilsa — to'liq ma'lumot (qaytarilgan va berilgan tovarlar)
const ReturnsHistoryTab = ({ ctx }) => {
  const { t } = useTranslation()
  const som = t('unit_som')
  const { productImages } = useSettingsStore()
  const {
    returnsHistoryMonthFilter, setReturnsHistoryMonthFilter, returnsMonthOptions2, formatMonthValue,
    filteredCancelledReturns, sortedReturnsHistory, setReturnsHistoryPage,
    user, bump, fetchData,
  } = ctx
  const canEdit = user?.role === 'admin' || user?.role === 'manager'
  const [open, setOpen] = useState(null)
  const [editingReturn, setEditingReturn] = useState(null)

  const money = (v) => `${formatNumber(Math.round(v || 0))} ${som}`
  const typeBadge = (r) => (
    <Badge color={r.type === 'exchange' ? 'bg-accent-blue/10 text-accent-blue' : 'bg-accent-red/10 text-accent-red'}>
      {r.typeLabel || (r.type === 'exchange' ? t('col_exchange') : t('sl_rh_type_cancel'))}
    </Badge>
  )
  const exItemsOf = (r) => r.exchangedForItems || (r.exchangedForItem ? [r.exchangedForItem] : [])
  const names = (items) => (items.length > 1 ? `${items[0].name} +${items.length - 1}` : (items[0]?.name || '—'))

  const ItemList = ({ title, items, barcodes }) => (
    <div className="space-y-2">
      <h4 className="text-sm font-bold uppercase tracking-wider text-text-muted">{title}</h4>
      <div className="panel px-4 divide-y divide-border">
        {items.map((it, i) => {
          const img = it.productId && productImages[String(it.productId)]?.[0]
          return (
            <div key={i} className="py-3 flex items-center gap-3">
              {img ? <img src={img} alt="" className="w-12 h-12 rounded-xl object-cover border border-border shrink-0" /> : null}
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-text-primary truncate">{it.name}</p>
                <p className="text-sm text-text-muted font-mono">{barcodes?.[i] || '—'}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <MonthRangeSelect value={returnsHistoryMonthFilter} onChange={(v) => { setReturnsHistoryMonthFilter(v); setReturnsHistoryPage(1) }}
          months={returnsMonthOptions2 || []} monthLabel={formatMonthValue} />
        <span className="text-[15px] text-text-muted">{t('sl_rh_total', { n: filteredCancelledReturns.length })}</span>
      </div>

      <DataTable rows={sortedReturnsHistory} resetKey={returnsHistoryMonthFilter} initialSort={{ key: 'date', dir: 'desc' }}
        onRowClick={setOpen} empty={t('sl_profit_empty')}
        columns={[
          { key: 'date', label: t('sl_rh_th_cancel_date'), sortValue: r => r.returnedAt || '', render: r => (
            <span className="flex items-center gap-2 whitespace-nowrap text-text-secondary">{dt(r.returnedAt)}{r.editCount > 0 && <span className="text-accent-blue font-bold">✎</span>}</span>
          ) },
          { key: 'type', label: t('sl_rh_th_type'), sortValue: r => r.type, render: typeBadge },
          { key: 'items', label: t('sl_rh_th_returned'), hideOnMobile: true, sortValue: r => names(r.returnedItems || []), render: r => <span className="block max-w-[240px] truncate">{names(r.returnedItems || [])}</span> },
          { key: 'customer', label: t('col_customer'), sortValue: r => r.customerName || '', render: r => (
            <div className="min-w-0">
              <p className="font-semibold text-text-primary truncate">{r.customerName || '—'}</p>
              <p className="text-sm text-text-muted truncate">{r.processedByName || r.soldByName || '—'}</p>
            </div>
          ) },
          { key: 'amount', label: t('col_amount'), align: 'right', sortValue: r => r.displayAmount || 0, render: r => <span className="font-bold text-accent-red whitespace-nowrap">{money(r.displayAmount)}</span> },
          { key: 'saleDate', label: t('sl_rh_th_sale_date'), optional: true, sortValue: r => r.soldAt || '', render: r => <span className="whitespace-nowrap text-text-secondary">{dt(r.soldAt)}</span> },
          { key: 'extra', label: t('sl_rh_th_extra'), optional: true, align: 'right', sortValue: r => r.additionalPayment || 0, render: r => (r.additionalPayment || 0) > 0 ? money(r.additionalPayment) : '—' },
          { key: 'pay', label: t('sl_rh_th_payment'), optional: true, render: r => r.payLabel || '—' },
          { key: 'reason', label: t('col_reason'), optional: true, render: r => <span className="block max-w-[200px] truncate">{r.reasonLabel || '—'}</span> },
        ]} tableId="returns_history" />

      <Modal open={!!open} onClose={() => setOpen(null)} size="lg" icon={RotateCcw}
        title={open && dt(open.returnedAt)} subtitle={open && <span className="flex items-center gap-2">{open.customerName || '—'} {typeBadge(open)}</span>}
        actions={open && canEdit && (
          <button onClick={() => setEditingReturn(open)} title={t('sl_edit_return_title')}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-accent-blue hover:bg-bg-tertiary"><Pencil size={19} /></button>
        )}>
        {open && (
          <div className="space-y-4">
            <DetailGrid cols={3} items={[
              { label: t('sl_rh_th_sale_date'), value: dt(open.soldAt) },
              { label: t('sl_rh_th_cancel_date'), value: dt(open.returnedAt) },
              { label: t('col_customer'), value: <>{open.customerName || '—'}{open.originalCustomerName && <span className="block text-sm text-text-muted line-through">{open.originalCustomerName}</span>}</> },
              { label: t('col_employee'), value: <>{open.soldByName || '—'}{open.processedBy && String(open.processedBy) !== String(open.soldBy) && <span className="block text-sm text-accent-red">↩ {open.processedByName}</span>}</> },
              { label: t('col_amount'), value: <span className="text-accent-red font-bold">{money(open.displayAmount)}</span> },
              { label: t('sl_rh_th_extra'), value: (open.additionalPayment || 0) > 0 ? money(open.additionalPayment) : '—' },
              { label: t('sl_rh_th_payment'), value: `${open.payLabel || '—'}${open.originalSaleCardType ? ' · ' + String(open.originalSaleCardType).toUpperCase() : ''}` },
              { label: t('col_reason'), value: open.reasonLabel || '—' },
            ]} />
            <ItemList title={t('sl_rh_th_returned')} items={open.returnedItems || []} barcodes={open.barcodes} />
            {exItemsOf(open).length > 0 && <ItemList title={t('col_new_product')} items={exItemsOf(open)} barcodes={open.exBarcodes} />}
          </div>
        )}
      </Modal>

      {editingReturn && (
        <EditReturnModal ret={editingReturn} onClose={() => setEditingReturn(null)}
          onSaved={() => { setEditingReturn(null); setOpen(null); fetchData(); bump() }} />
      )}
    </motion.div>
  )
}

export default ReturnsHistoryTab
