import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Printer, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import { useSettingsStore } from '../../store/settingsStore'

const formatPrice = (price) => Math.round(price).toLocaleString('uz-UZ') + ' ' + i18n.t('unit_som')

const SuccessModal = ({ sale, onClose, onCancel }) => {
  const { t } = useTranslation()
  const som = i18n.t('unit_som')
  const { companyName } = useSettingsStore()
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
            <td style="padding:2px 0;font-size:11px;">${i.barcode || '—'}</td>
            <td style="padding:2px 0;font-size:11px;text-align:right;">${(i.salePrice || 0).toLocaleString('uz-UZ')} ${som}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="2" style="font-size:11px;color:#888;">Tovarlar ro'yxati mavjud emas</td></tr>`

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
          table { width: 100%; border-collapse: collapse; }
          @media print {
            body { width: 280px; }
            @page { margin: 0; size: 80mm auto; }
          }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size:16px;margin-bottom:4px;">${companyName}</div>
        <div class="center small">${companyName} Do'koni</div>
        <div class="divider"></div>
        <div style="font-size:11px;">Chek: <span class="bold">${sale.id}</span></div>
        <div style="font-size:11px;">Sana: ${saleDate}</div>
        ${sale.customerName && sale.customerName !== "Noma'lum" ? `<div style="font-size:11px;">Mijoz: ${sale.customerName}</div>` : ''}
        <div class="divider"></div>
        <table>${itemsHtml}</table>
        <div class="divider"></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;">
          <span>Subtotal:</span><span>${(sale.subtotal || sale.total).toLocaleString('uz-UZ')} ${som}</span>
        </div>
        ${sale.discount > 0 ? `
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#c00;">
          <span>Chegirma (${sale.discount}%):</span><span>-${Math.round((sale.subtotal||sale.total)*sale.discount/100).toLocaleString('uz-UZ')} ${som}</span>
        </div>` : ''}
        <div class="divider"></div>
        <div style="display:flex;justify-content:space-between;" class="bold">
          <span style="font-size:14px;">JAMI:</span>
          <span style="font-size:14px;">${sale.total.toLocaleString('uz-UZ')} ${som}</span>
        </div>
        <div style="font-size:11px;margin-top:4px;">To'lov: ${
          sale.paymentType === 'cash' ? 'Naqd' :
          sale.paymentType === 'card' ? 'Karta' :
          sale.paymentType === 'installment' ? `Muddatli (${sale.installmentMonths || sale.installmentTermMonths || 3} oy)` :
          "Bank o'tkazma"
        }</div>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-bg-secondary border border-border rounded-[2.5rem] p-8 max-w-md w-full text-center shadow-glow-red"
      >
        <div className="w-20 h-20 bg-accent-green/10 text-accent-green rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-syne font-extrabold text-text-primary mb-2">{t('sl_success_title')}</h2>
        <p className="text-text-secondary text-sm mb-6">{t('sl_success_sale_id')} <span className="font-mono text-text-primary">{sale.id}</span></p>

        <div className="bg-bg-tertiary rounded-2xl p-4 mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t('sl_success_total')}</span>
            <span className="text-text-primary font-bold">{formatPrice(sale.total)}</span>
          </div>
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

        <div className="grid grid-cols-2 gap-3 mb-6">
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
