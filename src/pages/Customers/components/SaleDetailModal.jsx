import { useTranslation } from 'react-i18next'
import { Receipt, User } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import { DetailGrid, Badge } from '../../../components/ui/Kit'
import { formatPrice, formatDateTime } from '../../../utils/format'

const payLabel = (t, type) => ({ cash: t('pay_cash'), card: t('pay_card'), installment: t('pay_installment'), transfer: t('sl_ns_pay_transfer'), bank_transfer: t('pay_transfer') }[type] || type || '—')

// Bitta xarid (chek) — mijoz profilidan ichma-ich ochiladi
const SaleDetailModal = ({ sale, onClose, barcodeSelectClass = '' }) => {
  const { t } = useTranslation()
  const cancelled = sale?.status === 'cancelled'
  return (
    <Modal open={!!sale} onClose={onClose} size="md" icon={Receipt}
      title={sale ? `${t('cust_sale_check')} · ${formatDateTime(sale.soldAt)}` : ''}
      subtitle={sale && (
        <div className="flex flex-wrap items-center gap-2">
          {cancelled && <Badge color="bg-accent-red/10 text-accent-red">{t('cust_cancelled')}</Badge>}
          {sale.isUsedSale && <Badge color="bg-accent-orange/10 text-accent-orange">B/U</Badge>}
          <Badge>{payLabel(t, sale.paymentType)}</Badge>
          {sale.soldByName && <span className="flex items-center gap-1 text-sm"><User size={13} /> {sale.soldByName}</span>}
        </div>
      )}>
      {sale && (
        <div className="space-y-4">
          <div className="space-y-2">
            {(sale.items || []).map((it, i) => (
              <div key={i} className="flex items-center justify-between gap-3 bg-bg-secondary border border-border rounded-xl px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-text-primary [overflow-wrap:anywhere]">{it.name || it.productName}</p>
                  {it.barcode && <p className={`text-xs font-mono text-text-muted ${barcodeSelectClass}`}>{it.barcode}</p>}
                </div>
                <p className="text-[15px] font-bold text-text-primary whitespace-nowrap">{formatPrice(it.salePrice ?? it.price)}</p>
              </div>
            ))}
          </div>
          <DetailGrid items={[
            { label: t('cust_sale_total'), value: formatPrice(sale.total), className: 'text-accent-green' },
            sale.discount > 0 && { label: t('cust_sale_discount'), value: `${sale.discount}%` },
            sale.promoDiscountAmount > 0 && { label: t('cust_sale_promo'), value: `− ${formatPrice(sale.promoDiscountAmount)}` },
            sale.balanceUsed > 0 && { label: t('cust_sale_balance_used'), value: formatPrice(sale.balanceUsed) },
            sale.cashbackAmount > 0 && { label: t('cust_sale_cashback'), value: `+ ${formatPrice(sale.cashbackAmount)}` },
            sale.paymentType === 'installment' && { label: t('col_debt'), value: formatPrice(Math.max(0, sale.installmentDebt ?? 0)), className: (sale.installmentDebt || 0) > 0 ? 'text-accent-red' : '' },
            sale.installmentOrgName && { label: t('cust_sale_org'), value: sale.installmentOrgName },
            sale.contractNumber && { label: t('cust_sale_contract'), value: sale.contractNumber },
            sale.shopName && { label: t('rpt_col_shop'), value: sale.shopName },
            cancelled && sale.cancelReason && { label: t('col_reason'), value: sale.cancelReason },
          ]} />
        </div>
      )}
    </Modal>
  )
}

export default SaleDetailModal
