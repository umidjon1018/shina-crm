// ============================
// HELPERS
// ============================
const formatPrice = (n) => (n || 0).toLocaleString('uz-UZ')
const formatUSD = (n) => '$' + (n || 0).toLocaleString('uz-UZ')

const statusConfig = {
  paid: { key: 'inc_status_paid', color: 'text-accent-green', bg: 'bg-accent-green/10' },
  partial: { key: 'inc_status_partial', color: 'text-accent-orange', bg: 'bg-accent-orange/10' },
  credit: { key: 'inc_status_credit', color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
  unpaid: { key: 'inc_status_unpaid', color: 'text-accent-red', bg: 'bg-accent-red/10' },
  returned: { key: 'inc_status_returned', color: 'text-violet-500', bg: 'bg-violet-500/10' },
  transfer: { key: 'inc_status_transfer', color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
  production: { key: 'inc_status_production', color: 'text-accent-green', bg: 'bg-accent-green/10' },
}

const getDueDays = (dueDate) => {
  if (!dueDate) return null
  const diff = new Date(dueDate) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const calcRateDiff = (batch) => {
  if (!batch.payments?.length || !batch.paidUSD) return null
  const paidUZS = batch.payments.reduce((sum, p) => sum + p.amountUZS, 0)
  const entryValueForPaid = batch.paidUSD * batch.entryUsdRate
  return entryValueForPaid - paidUZS
}

const calcPaymentRateDiff = (payment, entryUsdRate) => {
  const entryValue = payment.amountUSD * entryUsdRate
  return entryValue - payment.amountUZS
}

export { formatPrice, formatUSD, statusConfig, getDueDays, calcRateDiff, calcPaymentRateDiff }
