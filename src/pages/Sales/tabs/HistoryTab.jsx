import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Pencil, Receipt } from 'lucide-react'
import { useSettingsStore } from '../../../store/settingsStore'
import EditSaleModal from '../../../components/sales/EditSaleModal'
import Modal from '../../../components/ui/Modal'
import MonthRangeSelect from '../../../components/ui/MonthRangeSelect'
import DataTable from '../../../components/ui/DataTable'
import { Segmented, Badge, DetailGrid } from '../../../components/ui/Kit'
import { formatNumber, formatDateTime } from '../../../utils/format'

// Sotuvlar tarixi: ixcham ro'yxat (sana, mijoz, tovarlar, summa, to'lov, holat); qator bosilsa — to'liq ma'lumot oynasi
const HistoryTab = ({ ctx }) => {
  const { t } = useTranslation()
  const som = t('unit_som')
  const { productImages } = useSettingsStore()
  const [kind, setKind] = useState('new')
  const [open, setOpen] = useState(null)
  const [editingSale, setEditingSale] = useState(null)
  const {
    historyMonthFilter, setHistoryMonthFilter, historyMonthOptions, formatMonthValue,
    filteredSalesForHistory, setHistoryPage, exchangePairColors, getItemBarcode,
    productCategories, sources, usedSalesList,
    user, allCustomers, bump, fetchData,
  } = ctx
  const canEdit = user?.role === 'admin' || user?.role === 'manager'

  const money = (v) => `${formatNumber(Math.round(v || 0))} ${som}`
  const payLabel = (s) => (s.paymentType === 'cash' ? t('pay_cash') : s.paymentType === 'card' ? t('pay_card') : s.paymentType === 'installment' ? t('pay_installment') : t('sl_hist_pay_bank'))
  const sourceLabel = (s) => (s.source ? t('source_' + s.source, { defaultValue: sources.find(src => src.id === s.source)?.label || s.source }) : '—')
  const catLabel = (id, fallback) => { const c = productCategories.find(x => x.id === id); return c ? t('cat_' + c.id, { defaultValue: c.label }) : (fallback || id || '—') }
  const barcodeOf = (it) => { const b = it.barcode || getItemBarcode(it.itemId); return b && b !== '—' ? b : null }
  const qtyOf = (s) => s.items?.reduce((sum, it) => sum + (it.qty || 1), 0) || 0
  const itemsSummary = (s) => {
    const names = (s.items || []).map(i => i.name || 'Tovar')
    return names.length > 1 ? `${names[0]} +${names.length - 1}` : (names[0] || '—')
  }
  const status = (s) => {
    if (s.status === 'completed') return <Badge color={s._isExchange ? 'bg-accent-blue/10 text-accent-blue' : 'bg-accent-green/10 text-accent-green'}>{s.statusLabel || t('col_done')}</Badge>
    if (s.status === 'pending' || s.status === 'active') return <Badge color="bg-accent-orange/10 text-accent-orange">{s.statusLabel || t('pay_installment')}</Badge>
    return <Badge color="bg-accent-red/10 text-accent-red">{s.statusLabel || t('sl_hist_status_cancelled')}</Badge>
  }
  const discountText = (s) => (s.discount > 0
    ? `-${s.discount}% (${money(Math.round((s.subtotal || s.total) * s.discount / 100))})`
    : s.bundleDiscountAmount > 0 ? `${s.bundleDiscountPercent > 0 ? `-${s.bundleDiscountPercent}% ` : ''}(${money(s.bundleDiscountAmount)})` : null)

  const columns = (isUsed) => [
    { key: 'date', label: t('col_date'), sortValue: s => s.soldAt || '', render: s => (
      <span className="flex items-center gap-2 whitespace-nowrap text-text-secondary">
        {!isUsed && exchangePairColors[s.id] && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: exchangePairColors[s.id].replace(/,\s*0?\.\d+\)$/, ',1)') }} title={t('sl_hist_exchange_pair')} />}
        {formatDateTime(s.soldAt)}
        {s.editCount > 0 && <span className="text-accent-blue font-bold" title={t('sl_edit_history')}>✎</span>}
      </span>
    ) },
    { key: 'customer', label: t('col_customer'), sortValue: s => s.customerName || '', render: s => (
      <div className="min-w-0">
        <p className={`font-semibold truncate ${s.customerName ? 'text-text-primary' : 'text-text-muted italic'}`}>{s.customerName || "Noma'lum"}</p>
        <p className="text-sm text-text-muted truncate">{s.soldByName || '—'}</p>
      </div>
    ) },
    { key: 'items', label: t('col_product_name'), sortValue: s => itemsSummary(s), hideOnMobile: true, render: s => <span className="block max-w-[240px] truncate">{itemsSummary(s)}</span> },
    { key: 'total', label: t('sl_hist_th_total'), align: 'right', sortValue: s => s.total, render: s => (
      <div className="whitespace-nowrap">
        <p className="font-bold text-text-primary">{money(s.total)}</p>
        <p className="text-sm text-text-muted">{payLabel(s)}</p>
      </div>
    ) },
    ...(isUsed ? [] : [{ key: 'status', label: t('sl_hist_th_status'), align: 'right', sortValue: s => s.status, render: status }]),
    { key: 'qty', label: t('sl_hist_th_qty'), optional: true, align: 'center', sortValue: s => qtyOf(s), render: s => qtyOf(s) },
    { key: 'discount', label: t('col_discount'), optional: true, render: s => discountText(s) ? <span className="text-accent-orange whitespace-nowrap">{discountText(s)}</span> : <span className="text-text-muted">—</span> },
    { key: 'source', label: t('col_source'), optional: true, sortValue: s => sourceLabel(s), render: s => sourceLabel(s) },
    { key: 'card', label: t('pay_card'), optional: true, render: s => (s.paymentType === 'card' && s.cardType ? String(s.cardType).toUpperCase() : <span className="text-text-muted">—</span>) },
  ]

  const rows = kind === 'new' ? filteredSalesForHistory : usedSalesList
  const isUsed = open?.isUsedSale || kind === 'used'

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented value={kind} onChange={setKind} options={[
          { id: 'new', label: t('sl_hist_kind_new'), count: filteredSalesForHistory.length },
          { id: 'used', label: t('sl_hist_kind_used'), count: usedSalesList.length },
        ]} />
        {kind === 'new' && (
          <MonthRangeSelect value={historyMonthFilter} onChange={(v) => { setHistoryMonthFilter(v); setHistoryPage(1) }}
            months={historyMonthOptions} monthLabel={formatMonthValue} />
        )}
      </div>

      <DataTable key={kind} tableId={'sales_history_' + kind} rows={rows} columns={columns(kind === 'used')} rowKey={s => (kind === 'used' ? 'u' : 'n') + s.id}
        initialSort={{ key: 'date', dir: 'desc' }} resetKey={historyMonthFilter} onRowClick={setOpen}
        rowClass={s => (s.status === 'cancelled' ? 'bg-accent-red/5' : '')}
        empty={kind === 'used' ? t('sl_hist_bu_not_found') : t('sl_profit_empty')} />

      {/* Bitta sotuvning to'liq ma'lumoti */}
      <Modal open={!!open} onClose={() => setOpen(null)} size="lg" icon={Receipt}
        title={open && formatDateTime(open.soldAt)}
        subtitle={open && <span className="flex items-center gap-2">{open.customerName || "Noma'lum"} {!isUsed && status(open)}</span>}
        actions={open && canEdit && !isUsed && open.status !== 'cancelled' && (
          <button onClick={() => setEditingSale(open)} title={t('sl_edit_title')}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-accent-blue hover:bg-bg-tertiary"><Pencil size={19} /></button>
        )}>
        {open && (
          <div className="space-y-4">
            <DetailGrid cols={3} items={[
              { label: t('col_customer'), value: <>{open.customerName || "Noma'lum"}{open.originalCustomerName && <span className="block text-sm text-text-muted line-through">{open.originalCustomerName}</span>}</> },
              { label: t('col_employee'), value: <>{open.soldByName || '—'}{(open.status === 'cancelled' || open._isExchange) && open.cancelledByName && String(open.cancelledBy) !== String(open.soldBy) && <span className="block text-sm text-accent-red">↩ {open.cancelledByName}</span>}</> },
              { label: t('col_source'), value: sourceLabel(open) },
              { label: t('sl_hist_th_qty'), value: t('sl_inst_org_count', { n: qtyOf(open) }) },
              { label: t('col_discount'), value: discountText(open) ? <span className="text-accent-orange">{discountText(open)}</span> : '—' },
              { label: t('sl_hist_th_payment'), value: `${payLabel(open)}${open.paymentType === 'card' && open.cardType ? ' · ' + open.cardType.toUpperCase() : ''}` },
              { label: t('col_category'), value: open.isBundle ? 'Komplekt' : catLabel(open.items?.[0]?.productCategory || open.items?.[0]?.category, open.items?.[0]?.categoryLabel) },
              { label: t('sl_hist_th_total'), value: <span className="text-lg font-bold">{money(open.total)}</span> },
              open.fiscalStatus && { label: t('fis_receipt'), value: <span className={{ done: 'text-accent-green', pending: 'text-accent-orange', error: 'text-accent-red' }[open.fiscalStatus]}>{t('fis_st_' + open.fiscalStatus)}{open.fiscalSign ? ` · ${open.fiscalSign}` : ''}</span> },
            ]} />
            <div className="panel px-4 divide-y divide-border">
              {(open.items || []).map((it, i) => {
                const img = it.productId && productImages[String(it.productId)]?.[0]
                return (
                  <div key={i} className="py-3 flex items-center gap-3">
                    {img ? <img src={img} alt="" className="w-12 h-12 rounded-xl object-cover border border-border shrink-0" /> : null}
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-text-primary truncate">{it.name || 'Tovar'}</p>
                      <p className="text-sm text-text-muted font-mono">{it.measureQty != null ? `${String(it.measureQty).replace('.', ',')} ${it.unit || ''} × ${money(it.unitPrice)}` : <>{barcodeOf(it) || '—'}{(it.qty || 1) > 1 ? ` · ${it.qty} ${t('unit_pcs')}` : ''}</>}</p>
                    </div>
                    <p className="text-[15px] font-bold whitespace-nowrap">{money((it.price ?? it.salePrice ?? 0) * (it.qty || 1))}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Modal>

      {editingSale && (
        <EditSaleModal sale={editingSale} customers={allCustomers} onClose={() => setEditingSale(null)}
          onSaved={() => { setEditingSale(null); setOpen(null); fetchData(); bump() }} />
      )}
    </motion.div>
  )
}

export default HistoryTab
