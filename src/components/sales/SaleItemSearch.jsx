import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'

const formatPrice = (price) => Math.round(price).toLocaleString('uz-UZ') + ' ' + i18n.t('unit_som')

const SaleItemSearch = ({ salesList, onSelectSaleItem, allCustomers }) => {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const result = []
    salesList
      .filter(s => s.status !== 'cancelled' && s.paymentType !== 'installment')
      .forEach(s => {
        const customer = allCustomers.find(c => c.id === s.customerId)
        s.items?.forEach(it => {
          result.push({
            saleId: s.id,
            sale: s,
            itemId: it.id || it.itemId,
            barcode: it.barcode,
            name: it.name,
            qty: it.qty || 1,
            salePrice: it.salePrice,
            customerName: customer ? customer.name : "Noma'lum",
            phone: customer ? customer.phone : '',
            soldAt: s.soldAt
          })
        })
      })
    return result
  }, [salesList, allCustomers])

  const filtered = useMemo(() => {
    if (query.trim().length < 2) return []
    const q = query.toLowerCase()
    return rows.filter(r =>
      r.name?.toLowerCase().includes(q) ||
      r.barcode?.toLowerCase().includes(q) ||
      r.customerName?.toLowerCase().includes(q) ||
      r.phone?.includes(q)
    )
  }, [query, rows])

  return (
    <div className="space-y-3 relative">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('sl_sis_placeholder')}
          className="w-full pl-10 pr-4 py-3 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
        />
      </div>

      {filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-bg-secondary border border-border rounded-2xl shadow-xl overflow-auto max-h-64 z-50">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-tertiary sticky top-0 text-text-muted">
              <tr>
                <th className="px-3 sm:px-4 py-2 font-medium">{t('sl_sis_th_product')}</th>
                <th className="px-3 sm:px-4 py-2 font-medium">{t('sl_sis_th_customer')}</th>
                <th className="px-3 sm:px-4 py-2 font-medium text-right">{t('col_amount')}</th>
                <th className="px-3 sm:px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((row, idx) => (
                <tr key={`${row.saleId}-${row.itemId}-${idx}`} className="hover:bg-bg-tertiary/50 transition-colors">
                  <td className="px-3 sm:px-4 py-2 sm:py-3">
                    <p className="font-medium text-text-primary">{row.name}</p>
                    <p className="text-xs text-text-muted">{row.barcode}</p>
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3">
                    <p className="font-medium text-text-primary">{row.customerName}</p>
                    <p className="text-xs text-text-muted">{row.phone}</p>
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-right font-medium text-text-primary whitespace-nowrap">
                    {formatPrice(row.salePrice)}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-right">
                    <button
                      onClick={() => { onSelectSaleItem(row); setQuery('') }}
                      className="px-3 py-1.5 rounded-lg bg-accent-blue text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      {t('sl_sis_select')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default SaleItemSearch
