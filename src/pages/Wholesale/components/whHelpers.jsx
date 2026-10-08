import { createContext, useContext } from 'react'
import { Badge } from '../../../components/ui/Kit'
import { formatNumber, formatDate } from '../../../utils/format'
import { printHtml, esc } from '../../Income/components/supShared'

export const inputCls = 'w-full bg-bg-tertiary border border-border rounded-xl px-3.5 py-2.5 text-[15px] text-text-primary focus:outline-none focus:border-accent-red'
export const labelCls = 'text-sm text-text-secondary mb-1.5 block'

// Sahifa bo'ylab umumiy amallar: hujjat/mijoz oynasini ochish, yangi hujjat, to'lov
export const WhContext = createContext(null)
export const useWh = () => useContext(WhContext)

export const DOC_KINDS = ['sale', 'consignment', 'cons_sale', 'cons_return', 'return']
const KIND_COLOR = {
  sale: 'bg-accent-blue/10 text-accent-blue',
  consignment: 'bg-violet-500/10 text-violet-500',
  cons_sale: 'bg-accent-green/10 text-accent-green',
  cons_return: 'bg-accent-orange/10 text-accent-orange',
  return: 'bg-accent-red/10 text-accent-red',
}
export const KindBadge = ({ kind, t }) => <Badge color={KIND_COLOR[kind]}>{t('wh_kind_' + kind)}</Badge>

const PAY_COLOR = {
  paid: 'bg-accent-green/10 text-accent-green',
  partial: 'bg-accent-orange/10 text-accent-orange',
  unpaid: 'bg-bg-tertiary text-text-secondary',
  overdue: 'bg-accent-red/10 text-accent-red',
}
export const PayBadge = ({ status, t }) => (status ? <Badge color={PAY_COLOR[status]}>{t('wh_pay_' + status)}</Badge> : null)

const SRC_COLOR = {
  client: 'bg-violet-500/10 text-violet-500', group: 'bg-accent-blue/10 text-accent-blue',
  standard: 'bg-accent-green/10 text-accent-green', retail: 'bg-accent-orange/10 text-accent-orange', manual: 'bg-bg-tertiary text-text-secondary',
}
export const SourceBadge = ({ source, t }) => (source ? <Badge color={SRC_COLOR[source]}>{t('wh_src_' + source)}</Badge> : null)

export const PAY_METHODS = ['cash', 'card', 'transfer']
export const methodLabel = (t, m) => t({ cash: 'pay_cash', card: 'pay_card', transfer: 'pay_transfer' }[m] || 'pay_cash')

export const MethodPicker = ({ value, onChange, t }) => (
  <div className="grid grid-cols-3 gap-2">
    {PAY_METHODS.map(m => (
      <button key={m} type="button" onClick={() => onChange(m)}
        className={`py-2.5 rounded-xl text-[15px] font-semibold border transition-colors ${value === m ? 'g-brand text-white border-transparent' : 'border-border text-text-secondary hover:bg-bg-tertiary'}`}>
        {methodLabel(t, m)}
      </button>
    ))}
  </div>
)

export const Spinner = () => (
  <div className="py-16 flex justify-center"><div className="w-8 h-8 border-2 border-accent-red border-t-transparent rounded-full animate-spin" /></div>
)

export const som = (t, n) => `${formatNumber(n)} ${t('unit_som')}`

// O'lcham tovar nomida bo'lsa qayta yozilmaydi
export const sizeOf = (name, size) => (size && !String(name || '').includes(size) ? size : '')

// Yuk xati (nakladnoy) — chop etish
export const printDoc = (t, doc, company) => {
  const isCons = doc.kind === 'consignment'
  const rows = doc.lines.map((l, i) => `<tr><td>${i + 1}</td><td>${esc(l.name)}</td><td>${esc(l.size)}</td>
    <td class="n">${l.bulk ? `${String(l.qty).replace('.', ',')} ${esc(l.unit)}` : l.qty}</td><td class="n">${formatNumber(l.price)}</td><td class="n">${formatNumber(l.price * l.qty)}</td></tr>`).join('')
  printHtml(doc.no, `
    <h2>${esc(isCons ? t('wh_print_cons_title') : t('wh_print_title'))} № ${esc(doc.no)}</h2>
    <div class="muted">${formatDate(doc.createdAt)}${doc.parentNo ? ' · ' + esc(doc.parentNo) : ''}</div>
    <table style="margin-top:14px"><tr>
      <td style="width:50%;vertical-align:top"><b>${esc(t('wh_print_seller'))}:</b> ${esc(company)}<br>${esc(t('wh_col_shop'))}: ${esc(doc.shopName)}</td>
      <td style="vertical-align:top"><b>${esc(t('wh_print_buyer'))}:</b> ${esc(doc.clientName)}<br>
        ${doc.client?.inn ? esc(t('wh_f_inn')) + ': ' + esc(doc.client.inn) + '<br>' : ''}
        ${doc.client?.address ? esc(doc.client.address) + '<br>' : ''}${esc(doc.client?.phone || '')}</td>
    </tr></table>
    <table><thead><tr><th>#</th><th>${esc(t('wh_col_product'))}</th><th>${esc(t('wh_col_size'))}</th><th class="n">${esc(t('wh_col_qty'))}</th>
      <th class="n">${esc(t('wh_col_price'))}</th><th class="n">${esc(t('wh_col_sum'))}</th></tr></thead><tbody>${rows}</tbody></table>
    <table style="width:auto;margin-left:auto">
      ${doc.discount > 0 ? `<tr><td>${esc(t('wh_subtotal'))}</td><td class="n">${formatNumber(doc.subtotal)}</td></tr>
      <tr><td>${esc(t('wh_discount'))}</td><td class="n">−${formatNumber(doc.discount)}</td></tr>` : ''}
      <tr><td><b>${esc(t('wh_total'))}</b></td><td class="n"><b>${formatNumber(doc.total)} ${esc(t('unit_som'))}</b></td></tr>
      ${doc.dueDate ? `<tr><td>${esc(t('wh_due_date'))}</td><td class="n">${formatDate(doc.dueDate)}</td></tr>` : ''}
    </table>
    ${doc.notes ? `<p class="muted">${esc(doc.notes)}</p>` : ''}
    <div class="sign"><span>${esc(t('wh_print_gave'))}: ____________________</span><span>${esc(t('wh_print_received'))}: ____________________</span></div>`)
}

// Akt sverka — chop etish
export const printStatement = (t, st, company) => {
  const rows = st.rows.map(r => `<tr><td>${formatDate(r.at)}</td><td>${esc(t('wh_st_' + r.type))} ${esc(r.ref)}</td>
    <td class="n">${r.debit ? formatNumber(r.debit) : ''}</td><td class="n">${r.credit ? formatNumber(r.credit) : ''}</td><td class="n">${formatNumber(r.balance)}</td></tr>`).join('')
  printHtml(t('wh_statement'), `
    <h2>${esc(t('wh_statement'))}</h2>
    <div class="muted">${esc(company)} — ${esc(st.client.name)} · ${formatDate(st.from)} — ${formatDate(st.to)}</div>
    <table><thead><tr><th>${esc(t('wh_col_date'))}</th><th>${esc(t('wh_col_operation'))}</th><th class="n">${esc(t('wh_st_debit'))}</th>
      <th class="n">${esc(t('wh_st_credit'))}</th><th class="n">${esc(t('wh_st_balance'))}</th></tr></thead>
      <tbody><tr><td colspan="4"><b>${esc(t('wh_st_opening'))}</b></td><td class="n"><b>${formatNumber(st.opening)}</b></td></tr>${rows}
      <tr><td><b>${esc(t('wh_st_turnover'))}</b></td><td></td><td class="n"><b>${formatNumber(st.debit)}</b></td><td class="n"><b>${formatNumber(st.credit)}</b></td><td></td></tr>
      <tr><td colspan="4"><b>${esc(t('wh_st_closing'))}</b></td><td class="n"><b>${formatNumber(st.closing)}</b></td></tr></tbody></table>
    <div class="sign"><span>${esc(company)}: ____________________</span><span>${esc(st.client.name)}: ____________________</span></div>`)
}
