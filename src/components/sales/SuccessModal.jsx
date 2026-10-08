import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Printer, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import { useSettingsStore } from '../../store/settingsStore'
import { StackGuard } from '../ui/Modal'

const formatPrice = (price) => Math.round(price).toLocaleString('uz-UZ') + ' ' + i18n.t('unit_som')

const SuccessModal = ({ sale, onClose, onCancel }) => {
  const { t } = useTranslation()
  const som = i18n.t('unit_som')
  const { companyName, companyLogo } = useSettingsStore()
  const [timeLeft, setTimeLeft] = useState(300)

  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    const saleDate = new Date(sale.soldAt).toLocaleString('uz-UZ')

    const itemsHtml = sale.items?.length > 0
      ? sale.items.map(i => `
          <tr>
            <td style="padding:3px 0;font-size:11px;">
              ${i.productName ? `<div style="font-weight:600;">${i.productName}</div>` : ''}
              ${i.barcode ? `<div style="font-size:9px;color:#777;font-family:monospace;">${i.barcode}</div>` : ''}
            </td>
            <td style="padding:3px 0;font-size:11px;text-align:right;white-space:nowrap;">${(i.salePrice || 0).toLocaleString('uz-UZ')} ${som}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="2" style="font-size:11px;color:#888;">Tovarlar ro'yxati mavjud emas</td></tr>`

    const logoHtml = companyLogo
      ? `<img src="${companyLogo}" alt="logo" style="max-width:120px;max-height:60px;object-fit:contain;margin-bottom:6px;" /><br/>`
      : ''

    const paymentLabel =
      sale.paymentType === 'cash' ? 'Naqd' :
      sale.paymentType === 'card' ? 'Karta' :
      sale.paymentType === 'installment' ? `Muddatli (${sale.installmentMonths || sale.installmentTermMonths || 3} oy)` :
      "Bank o'tkazma"

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Chek</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; width: 280px; padding: 12px; }
          .center { text-align: center; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .bold { font-weight: bold; }
          .small { font-size: 10px; color: #555; }
          .row { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }
          table { width: 100%; border-collapse: collapse; }
          @media print {
            body { width: 280px; }
            @page { margin: 0; size: 80mm auto; }
          }
        </style>
      </head>
      <body>
        <div class="center" style="margin-bottom:6px;">
          ${logoHtml}
          <div class="bold" style="font-size:16px;">${companyName}</div>
        </div>
        <div class="divider"></div>
        <div class="row"><span>Chek:</span><span class="bold">${sale.id}</span></div>
        <div class="row"><span>Sana:</span><span>${saleDate}</span></div>
        ${sale.soldByName ? `<div class="row"><span>Kassir:</span><span>${sale.soldByName}</span></div>` : ''}
        ${sale.customerName && sale.customerName !== "Noma'lum" ? `<div class="row"><span>Mijoz:</span><span>${sale.customerName}</span></div>` : ''}
        <div class="divider"></div>
        <table>${itemsHtml}</table>
        <div class="divider"></div>
        <div class="row"><span>Subtotal:</span><span>${(sale.subtotal || sale.total).toLocaleString('uz-UZ')} ${som}</span></div>
        ${sale.discount > 0 ? `
        <div class="row" style="color:#c00;">
          <span>Chegirma (${sale.discount}%):</span><span>-${Math.round((sale.subtotal||sale.total)*sale.discount/100).toLocaleString('uz-UZ')} ${som}</span>
        </div>` : ''}
        <div class="divider"></div>
        <div class="row bold" style="font-size:14px;">
          <span>JAMI:</span><span>${sale.total.toLocaleString('uz-UZ')} ${som}</span>
        </div>
        ${sale.balanceUsed > 0 ? `<div class="row"><span>Balansdan:</span><span>-${sale.balanceUsed.toLocaleString('uz-UZ')} ${som}</span></div>
        <div class="row bold"><span>To'landi:</span><span>${Math.max(0, sale.total - sale.balanceUsed).toLocaleString('uz-UZ')} ${som}</span></div>` : ''}
        <div class="row" style="margin-top:4px;"><span>To'lov:</span><span>${paymentLabel}</span></div>
        ${sale.cashbackAmount > 0 ? `<div class="row"><span>Keshbek (balansga):</span><span>+${sale.cashbackAmount.toLocaleString('uz-UZ')} ${som}</span></div>` : ''}
        <div class="divider"></div>
        <div class="center small" style="margin-top:8px;">Xarid uchun rahmat!</div>
        <div class="center small">${companyName} — Ishonchli tanlov</div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 300)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[320] flex items-center justify-center p-4">
      <StackGuard onClose={onClose} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-bg-secondary border border-border rounded-[2.5rem] p-5 sm:p-8 max-w-md w-full text-center shadow-glow-red"
      >
        <div className="w-20 h-20 bg-accent-green/10 text-accent-green rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-syne font-extrabold text-text-primary mb-2">{t('sl_success_title')}</h2>
        <p className="text-text-secondary text-sm mb-4 sm:mb-6">{t('sl_success_sale_id')} <span className="font-mono text-text-primary">{sale.id}</span></p>

        <div className="bg-bg-tertiary rounded-2xl p-4 mb-4 sm:mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t('sl_success_total')}</span>
            <span className="text-text-primary font-bold">{formatPrice(sale.total)}</span>
          </div>
          {sale.balanceUsed > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{t('sl_loy_balance_row')}</span>
              <span className="text-accent-orange font-bold">-{formatPrice(sale.balanceUsed)}</span>
            </div>
          )}
          {sale.cashbackAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{t('cust_tx_cashback')}</span>
              <span className="text-accent-blue font-bold">+{formatPrice(sale.cashbackAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t('sl_success_payment')}</span>
            <span className="text-text-primary font-medium">
              {sale.paymentType === 'cash' ? t('pay_cash') :
               sale.paymentType === 'card' ? t('pay_card') :
               sale.paymentType === 'installment' ? t('sl_success_pay_installment', { n: sale.installmentTermMonths || sale.installmentMonths || 3 }) :
               sale.paymentType === 'transfer' ? t('sl_success_pay_transfer') :
               sale.paymentType}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t('sl_success_date')}</span>
            <span className="text-text-primary font-medium">{new Date(sale.soldAt).toLocaleString('uz-UZ')}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 sm:mb-6">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary font-medium hover:bg-border transition-colors"
          >
            <Printer size={18} /> {t('sl_success_print')}
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 py-3 bg-accent-red text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            {t('close')}
          </button>
        </div>

        {timeLeft > 0 && (
          <button
            onClick={() => onCancel(sale)}
            className="flex items-center justify-center gap-2 w-full py-3 bg-accent-red/10 text-accent-red rounded-xl font-medium hover:bg-accent-red/20 transition-colors"
          >
            <RotateCcw size={18} /> {t('sl_success_cancel', { time: formatTime(timeLeft) })}
          </button>
        )}
      </motion.div>
    </div>
  )
}

export default SuccessModal
