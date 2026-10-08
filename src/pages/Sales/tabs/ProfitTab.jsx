import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, TrendingUp, Wallet, Package, Percent } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getCategoryColor } from '../../../utils/categoryColors'
import { useSettingsStore } from '../../../store/settingsStore'
import Modal from '../../../components/ui/Modal'
import DataTable from '../../../components/ui/DataTable'
import { Segmented, Badge, DetailGrid } from '../../../components/ui/Kit'
import { HeroStat, MiniStat, shortNum } from '../../../components/charts/Charts'
import { formatNumber, formatDateTime } from '../../../utils/format'

// Sotuv qatorini dona qatorlariga bo'lish: tushum (chegirma bilan) va nasiya komissiyasi
// tovarlar orasida narxiga mutanosib taqsimlanadi — jami har doim sotuv summasiga teng
const toLines = (s) => {
  const its = s.items || []
  const gross = its.map(it => (Number(it.salePrice ?? it.price) || 0) * (it.qty || 1))
  const sumGross = gross.reduce((a, b) => a + b, 0)
  return its.map((it, i) => {
    const share = sumGross > 0 ? gross[i] / sumGross : 1 / its.length
    const revenue = Math.round((s.totalSale || 0) * share)
    const cost = (s.isUsedSale ? (it.acquiredPrice || 0) : (it.purchasePrice || 0)) * (it.qty || 1)
    const commission = Math.round((s.commission || 0) * share)
    const missingCost = !s.isUsedSale && !it.purchasePrice
    const profit = s.isCancelled || missingCost ? 0 : revenue - cost - commission
    return {
      id: `${s.id}-${i}`, sale: s, item: it,
      key: s.isUsedSale ? 'u:' + (it.name || '') : 'p:' + (it.productId || it.name || ''),
      name: it.name || it.productName || 'Tovar', productId: it.productId || null,
      categoryId: s.isUsedSale ? it.category : it.productCategory,
      barcode: it.barcode || null, qty: it.qty || 1, revenue, cost, commission, profit, missingCost,
      margin: revenue > 0 && !missingCost && !s.isCancelled ? Math.round((profit / revenue) * 100) : 0,
    }
  })
}

const ProfitTab = ({ ctx }) => {
  const { t } = useTranslation()
  const som = t('unit_som')
  const { productImages } = useSettingsStore()
  const {
    filteredProfitItems,
    profitMonthFilter, setProfitMonthFilter, profitMonthOptions, formatMonthValue,
    profitTypeFilter, setProfitTypeFilter,
    profitSearch, setProfitSearch, setProfitPage,
    productCategories, getInstallmentStatusMap,
  } = ctx
  const [view, setView] = useState('products')
  const [openProduct, setOpenProduct] = useState(null)
  const [openSale, setOpenSale] = useState(null)

  const money = (v) => `${formatNumber(Math.round(v || 0))} ${som}`
  const payLabel = (r) => ({ cash: t('pay_cash'), card: t('pay_card'), installment: t('pay_installment'), transfer: t('sl_ns_pay_transfer') }[r.paymentType] || r.paymentType)
  const catOf = (id, label) => {
    const c = productCategories.find(x => x.id === id || x.label === label)
    return { label: c ? t('cat_' + c.id, { defaultValue: c.label }) : (label || id || '—'), color: getCategoryColor(c?.id, productCategories).text }
  }
  const statusBadge = (s) => s.isCancelled
    ? <Badge color="bg-accent-red/10 text-accent-red">{t('sl_hist_status_cancelled')}</Badge>
    : s.paymentType === 'installment' && getInstallmentStatusMap[s.saleId]?.status !== 'paid'
      ? <Badge color="bg-accent-orange/10 text-accent-orange">{t('sl_profit_status_pending')}</Badge>
      : <Badge color="bg-accent-green/10 text-accent-green">{t('col_done')}</Badge>
  const profitCell = (r) => r.missingCost
    ? <span className="text-sm font-bold text-accent-orange whitespace-nowrap">{t('sl_profit_no_cost')}</span>
    : <span className={`font-bold whitespace-nowrap ${r.profit >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{money(r.profit)}</span>
  const marginCell = (r) => r.missingCost ? <span className="text-text-muted">—</span>
    : <span className={`font-bold ${r.margin >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{r.margin}%</span>

  const active = filteredProfitItems.filter(r => !r.isCancelled)
  const totalProfit = active.reduce((a, r) => a + r.profit, 0)
  const totalSales = active.reduce((a, r) => a + r.totalSale, 0)
  const totalQty = active.reduce((a, r) => a + r.qty, 0)
  const avgMargin = totalSales > 0 ? Math.round((totalProfit / totalSales) * 100) : 0

  const products = useMemo(() => {
    const m = new Map()
    for (const row of filteredProfitItems) {
      for (const l of toLines(row)) {
        let g = m.get(l.key)
        if (!g) m.set(l.key, g = { id: l.key, name: l.name, productId: l.productId, isUsed: row.isUsedSale, categoryId: l.categoryId, lines: [], qty: 0, revenue: 0, cost: 0, commission: 0, profit: 0, missingCost: false })
        g.lines.push(l)
        if (row.isCancelled) continue
        g.qty += l.qty; g.revenue += l.revenue; g.cost += l.cost; g.commission += l.commission; g.profit += l.profit
        if (l.missingCost) g.missingCost = true
      }
    }
    return [...m.values()].map(g => ({ ...g, margin: g.revenue > 0 ? Math.round((g.profit / g.revenue) * 100) : 0 }))
  }, [filteredProfitItems])

  const productName = (g) => (
    <div className="min-w-0">
      <p className="font-bold text-text-primary truncate">{g.name}</p>
      <p className="text-sm flex items-center gap-2">
        <span className={catOf(g.categoryId).color}>{catOf(g.categoryId).label}</span>
        {g.isUsed && <Badge color="bg-accent-orange/10 text-accent-orange">{t('sl_profit_used_badge')}</Badge>}
      </p>
    </div>
  )

  // Tovar oynasidagi qatorlar — Sotuv → Foyda jadvalining barcha ustunlari
  const lineColumns = [
    { key: 'date', label: t('col_date'), sortValue: l => l.sale.soldAt || '', render: l => <span className="whitespace-nowrap text-text-secondary">{formatDateTime(l.sale.soldAt)}</span> },
    { key: 'barcode', label: t('sl_profit_th_barcode'), render: l => l.sale.isUsedSale ? <Badge color="bg-accent-orange/10 text-accent-orange">{t('sl_profit_used_badge')}</Badge> : <span className="font-mono text-sm text-text-muted">{l.barcode || '—'}</span> },
    { key: 'customer', label: t('col_customer'), sortValue: l => l.sale.customerName, render: l => l.sale.customerName },
    { key: 'seller', label: t('col_employee'), sortValue: l => l.sale.soldByName, render: l => l.sale.soldByName },
    { key: 'cost', label: t('sl_profit_th_purchase'), align: 'right', sortValue: l => l.cost, render: l => <span className="whitespace-nowrap">{l.missingCost ? '—' : money(l.cost)}</span> },
    { key: 'revenue', label: t('sl_profit_th_sale'), align: 'right', sortValue: l => l.revenue, render: l => <span className="whitespace-nowrap">{money(l.revenue)}</span> },
    { key: 'qty', label: t('sl_profit_th_qty'), align: 'center', sortValue: l => l.qty, render: l => l.qty },
    { key: 'pay', label: t('sl_profit_th_payment'), render: l => <span>{payLabel(l.sale)}{l.sale.cardType && l.sale.paymentType === 'card' ? <span className="block text-xs uppercase text-text-muted">{l.sale.cardType}</span> : null}</span> },
    { key: 'status', label: t('sl_profit_th_status'), render: l => statusBadge(l.sale) },
    { key: 'commission', label: t('sl_profit_th_commission'), align: 'right', sortValue: l => l.commission, render: l => l.commission > 0 ? money(l.commission) : '—' },
    { key: 'margin', label: t('sl_profit_th_margin'), align: 'right', sortValue: l => l.margin, render: marginCell },
    { key: 'profit', label: t('sl_profit_th_profit'), align: 'right', sortValue: l => l.profit, render: profitCell },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <HeroStat gradient="green" icon={TrendingUp} label={t('sl_profit_total')} value={shortNum(totalProfit)} unit={som} sub={formatNumber(Math.round(totalProfit))} />
        <HeroStat gradient="cyan" icon={Wallet} label={t('sl_profit_sales')} value={shortNum(totalSales)} unit={som} sub={formatNumber(Math.round(totalSales))} />
        <MiniStat icon={Package} tone="orange" label={t('sl_profit_items_sold')} value={t('sl_inst_org_count', { n: totalQty })} />
        <MiniStat icon={Percent} tone="violet" label={t('sl_profit_avg_margin')} value={`${avgMargin}%`} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Segmented value={view} onChange={setView} options={[{ id: 'products', label: t('sl_profit_view_products') }, { id: 'sales', label: t('sl_profit_view_sales') }]} />
        <Segmented value={profitTypeFilter} onChange={(v) => { setProfitTypeFilter(v); setProfitPage(1) }}
          options={[{ id: 'all', label: t('filter_all') }, { id: 'new', label: t('sl_profit_type_new') }, { id: 'used', label: t('sl_profit_used_badge') }]} />
        <select value={profitMonthFilter} onChange={e => { setProfitMonthFilter(e.target.value); setProfitPage(1) }}
          className="bg-bg-secondary text-text-primary text-[15px] border border-border rounded-xl px-3 py-2.5 outline-none focus:border-accent-blue">
          <option value="all">{t('filter_all')}</option>
          {profitMonthOptions.filter(m => m !== 'all').map(m => <option key={m} value={m}>{formatMonthValue(m)}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input type="text" value={profitSearch} onChange={e => { setProfitSearch(e.target.value); setProfitPage(1) }} placeholder={t('sl_profit_search_ph')}
            className="w-full pl-10 pr-3 py-2.5 bg-bg-secondary border border-border text-text-primary rounded-xl text-[15px] focus:outline-none focus:border-accent-blue" />
        </div>
      </div>

      {view === 'products' ? (
        <DataTable rows={products} resetKey={`${profitSearch}|${profitMonthFilter}|${profitTypeFilter}`} initialSort={{ key: 'profit', dir: 'desc' }}
          onRowClick={setOpenProduct} empty={t('sl_profit_empty')}
          columns={[
            { key: 'name', label: t('col_product_name'), sortValue: g => g.name, render: productName },
            { key: 'qty', label: t('sl_profit_th_qty'), align: 'center', sortValue: g => g.qty, render: g => g.qty },
            { key: 'revenue', label: t('sl_profit_th_sale'), align: 'right', sortValue: g => g.revenue, render: g => <span className="whitespace-nowrap">{money(g.revenue)}</span> },
            { key: 'profit', label: t('sl_profit_th_profit'), align: 'right', sortValue: g => g.profit, render: profitCell },
            { key: 'margin', label: t('sl_profit_th_margin'), align: 'right', sortValue: g => g.margin, render: marginCell, hideOnMobile: true },
            { key: 'cost', label: t('sl_profit_th_purchase'), optional: true, align: 'right', sortValue: g => g.cost, render: g => g.missingCost ? '—' : <span className="whitespace-nowrap">{money(g.cost)}</span> },
            { key: 'comm', label: t('sl_profit_th_commission'), optional: true, align: 'right', sortValue: g => g.commission, render: g => g.commission > 0 ? <span className="whitespace-nowrap">{money(g.commission)}</span> : '—' },
            { key: 'sales', label: t('sl_profit_view_sales'), optional: true, align: 'center', sortValue: g => g.lines.length, render: g => g.lines.length },
          ]} tableId="profit_products" />
      ) : (
        <DataTable rows={filteredProfitItems} rowKey={r => (r.isUsedSale ? 'u' : 'n') + r.id} resetKey={`${profitSearch}|${profitMonthFilter}|${profitTypeFilter}`} initialSort={{ key: 'date', dir: 'desc' }}
          onRowClick={setOpenSale} empty={t('sl_profit_empty')}
          rowClass={r => (r.isCancelled ? 'bg-accent-red/5' : '')}
          columns={[
            { key: 'date', label: t('col_date'), sortValue: r => r.soldAt || '', render: r => <span className="whitespace-nowrap text-text-secondary">{formatDateTime(r.soldAt)}</span> },
            { key: 'name', label: t('col_product_name'), sortValue: r => r.name, render: r => <span className="block max-w-[260px] truncate font-semibold">{r.name}</span> },
            { key: 'customer', label: t('col_customer'), sortValue: r => r.customerName, render: r => r.customerName, hideOnMobile: true },
            { key: 'total', label: t('sl_profit_th_sale'), align: 'right', sortValue: r => r.totalSale, render: r => <span className="whitespace-nowrap">{money(r.totalSale)}</span> },
            { key: 'profit', label: t('sl_profit_th_profit'), align: 'right', sortValue: r => r.profit, render: r => r.isCancelled ? statusBadge(r) : profitCell(r) },
            { key: 'seller', label: t('col_employee'), optional: true, sortValue: r => r.soldByName || '', render: r => r.soldByName },
            { key: 'pay', label: t('sl_profit_th_payment'), optional: true, render: r => payLabel(r) },
            { key: 'qty', label: t('sl_profit_th_qty'), optional: true, align: 'center', sortValue: r => r.qty, render: r => r.qty },
            { key: 'cost', label: t('sl_profit_th_purchase'), optional: true, align: 'right', sortValue: r => r.purchaseTotal || 0, render: r => r.missingCost ? '—' : <span className="whitespace-nowrap">{money(r.purchaseTotal)}</span> },
            { key: 'margin', label: t('sl_profit_th_margin'), optional: true, align: 'right', sortValue: r => r.margin, render: marginCell },
          ]} tableId="profit_sales" />
      )}

      {/* Tovar bo'yicha to'liq ma'lumot */}
      <Modal open={!!openProduct} onClose={() => setOpenProduct(null)} size="xl" icon={TrendingUp}
        title={openProduct?.name} subtitle={openProduct && `${catOf(openProduct.categoryId).label}${openProduct.isUsed ? ' · ' + t('sl_profit_used_badge') : ''}`}>
        {openProduct && (
          <div className="space-y-4">
            {openProduct.productId && productImages[String(openProduct.productId)]?.length > 0 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {productImages[String(openProduct.productId)].map((img, i) => (
                  <img key={i} src={img} alt="" className="w-20 h-20 rounded-xl object-cover border border-border shrink-0" />
                ))}
              </div>
            )}
            <DetailGrid cols={3} items={[
              { label: t('sl_profit_items_sold'), value: t('sl_inst_org_count', { n: openProduct.qty }) },
              { label: t('sl_profit_th_sale'), value: money(openProduct.revenue) },
              { label: t('sl_profit_th_purchase'), value: openProduct.missingCost ? t('sl_profit_no_cost') : money(openProduct.cost) },
              { label: t('sl_profit_th_commission'), value: openProduct.commission > 0 ? money(openProduct.commission) : '—' },
              { label: t('sl_profit_th_profit'), value: profitCell(openProduct) },
              { label: t('sl_profit_th_margin'), value: marginCell(openProduct) },
            ]} />
            <DataTable rows={openProduct.lines} columns={lineColumns} initialSort={{ key: 'date', dir: 'desc' }}
              rowClass={l => (l.sale.isCancelled ? 'bg-accent-red/5' : '')} onRowClick={(l) => setOpenSale(l.sale)} />
          </div>
        )}
      </Modal>

      {/* Bitta sotuv — jadvaldagi barcha ustunlar */}
      <Modal open={!!openSale} onClose={() => setOpenSale(null)} size="lg"
        title={openSale && formatDateTime(openSale.soldAt)} subtitle={openSale?.customerName}>
        {openSale && (
          <div className="space-y-4">
            <DetailGrid cols={3} items={[
              { label: t('col_customer'), value: openSale.customerName },
              { label: t('col_employee'), value: openSale.soldByName },
              { label: t('sl_profit_th_category'), value: catOf(openSale.categoryId, openSale.categoryLabel).label },
              { label: t('sl_profit_th_payment'), value: `${payLabel(openSale)}${openSale.cardType && openSale.paymentType === 'card' ? ' · ' + openSale.cardType.toUpperCase() : ''}` },
              { label: t('sl_profit_th_status'), value: statusBadge(openSale) },
              { label: t('sl_profit_th_qty'), value: t('sl_inst_org_count', { n: openSale.qty }) },
              { label: t('sl_profit_th_purchase'), value: openSale.missingCost ? t('sl_profit_no_cost') : money(openSale.purchaseTotal) },
              { label: t('sl_profit_th_sale'), value: money(openSale.saleTotal ?? openSale.totalSale) },
              { label: t('sl_profit_th_commission'), value: openSale.commission > 0 ? money(openSale.commission) : '—' },
              { label: t('sl_profit_th_margin'), value: marginCell(openSale) },
              { label: t('sl_profit_th_profit'), value: profitCell(openSale) },
            ]} />
            <div className="divide-y divide-border panel px-4">
              {toLines(openSale).map(l => (
                <div key={l.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary truncate">{l.name}</p>
                    <p className="text-sm text-text-muted font-mono">{l.barcode || (openSale.isUsedSale ? t('sl_profit_used_badge') : '—')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold whitespace-nowrap">{money(l.revenue)}</p>
                    <p className="text-sm">{profitCell(l)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}

export default ProfitTab
