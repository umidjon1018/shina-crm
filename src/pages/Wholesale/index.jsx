import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { AlertCircle, FileText, PackageOpen, Wallet, Users, HandCoins, Tags, Warehouse, ShoppingBag } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useShopStore } from '../../store/shopStore'
import SectionHub from '../../components/ui/SectionHub'
import PeriodFilter from '../../components/ui/PeriodFilter'
import { PageHeader } from '../../components/ui/Kit'
import { presetRange } from '../../utils/period'
import { WhContext } from './components/whHelpers'
import WholesaleOverview from './components/WholesaleOverview'
import DocFormModal from './components/DocFormModal'
import DocDetailModal from './components/DocDetailModal'
import PaymentModal from './components/PaymentModal'
import ClientProfileModal from './components/ClientProfileModal'
import DocsTab from './tabs/DocsTab'
import ClientsTab from './tabs/ClientsTab'
import DebtsTab from './tabs/DebtsTab'
import ConsignedTab from './tabs/ConsignedTab'
import PricesTab from './tabs/PricesTab'
import OrdersTab from './tabs/OrdersTab'

// Ulgurji savdo: dilerlarga sotuv va konsignatsiya, qarz va to'lovlar, ulgurji narxlar
const Wholesale = () => {
  const { t } = useTranslation()
  const { hasPermission } = useAuthStore()
  const { shops, selectedShopId } = useShopStore()
  const [preset, setPreset] = useState('month')
  const [range, setRange] = useState(() => presetRange('month'))
  const [section, setSection] = useState(() => new URLSearchParams(window.location.search).get('section'))
  const [form, setForm] = useState(null)
  const [docId, setDocId] = useState(null)
  const [payment, setPayment] = useState(null)
  const [clientId, setClientId] = useState(null)

  // Sidebar'da ulgurji ombor tanlangan bo'lsa — shu ombor, aks holda hammasi
  const shopId = shops.some(s => s.id === selectedShopId && s.kind === 'wholesale') ? selectedShopId : 'all'
  const hasWarehouse = shops.some(s => s.kind === 'wholesale' && s.isActive)

  const ctx = useMemo(() => ({
    // Har ochilishda qayta yaratiladi — boshqa oyna ustida ochilsa ham eng yuqorida turadi
    openDoc: (id) => setDocId({ id, n: Date.now() }),
    openClient: (id) => setClientId({ id, n: Date.now() }),
    newDoc: (kind, client) => setForm({ kind, clientId: client || null }),
    pay: (client, doc, amount) => setPayment({ clientId: client || null, docId: doc || null, amount: amount || null }),
  }), [])

  const SECTIONS = [
    { id: 'orders', perm: 'wholesale', icon: ShoppingBag, tone: 'blue', render: () => <OrdersTab /> },
    { id: 'clients', perm: 'wholesale', icon: Users, tone: 'cyan', render: () => <ClientsTab /> },
    { id: 'debts', perm: 'wholesale.debts', icon: HandCoins, tone: 'orange', render: () => <DebtsTab /> },
    { id: 'consigned', perm: 'wholesale', icon: PackageOpen, tone: 'violet', render: () => <ConsignedTab /> },
    { id: 'prices', perm: 'wholesale', icon: Tags, tone: 'green', render: () => <PricesTab /> },
  ].filter(s => hasPermission(s.perm)).map(s => ({ ...s, label: t('wh_sec_' + s.id) }))

  if (!hasPermission('wholesale')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-accent-red/10 flex items-center justify-center"><AlertCircle size={28} className="text-accent-red" /></div>
        <h2 className="font-syne font-bold text-xl text-text-primary">{t('exp_no_permission')}</h2>
      </div>
    )
  }

  const canDocs = hasPermission('wholesale.docs')
  return (
    <WhContext.Provider value={ctx}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-5">
        <PageHeader title={t('wh_page_title')} subtitle={t('wh_page_subtitle')}
          actions={<>
            {canDocs && <button onClick={() => ctx.newDoc('sale')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl g-brand text-white font-bold shadow-md"><FileText size={18} />{t('wh_new_sale')}</button>}
            {canDocs && <button onClick={() => ctx.newDoc('consignment')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl panel font-bold text-text-primary hover:border-border-bright"><PackageOpen size={18} />{t('wh_new_consignment')}</button>}
            {hasPermission('wholesale.debts') && <button onClick={() => ctx.pay()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl panel font-bold text-text-primary hover:border-border-bright"><Wallet size={18} />{t('wh_accept_payment')}</button>}
          </>} />

        {!hasWarehouse && (
          <div className="panel p-4 flex items-start gap-3 border-accent-orange/40">
            <Warehouse size={22} className="text-accent-orange shrink-0 mt-0.5" />
            <div>
              <p className="text-[15px] font-semibold text-text-primary">{t('wh_no_warehouse')}</p>
              <p className="text-sm text-text-muted">{t('wh_no_warehouse_hint')}</p>
            </div>
          </div>
        )}

        {SECTIONS.length > 0 && <SectionHub variant="bar" sections={SECTIONS} openId={section} onOpenChange={setSection} />}
        <div className="flex justify-end">
          <PeriodFilter preset={preset} range={range} onChange={(p, r) => { setPreset(p); setRange(r) }} />
        </div>
        <WholesaleOverview range={range} shopId={shopId} onOpen={(id) => SECTIONS.some(s => s.id === id) && setSection(id)} />
        <div className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-text-primary">{t('wh_docs_title')}</h2>
          <DocsTab range={range} shopId={shopId} />
        </div>
      </motion.div>

      <DocFormModal open={!!form} kind={form?.kind} clientId={form?.clientId} onClose={() => setForm(null)}
        onSaved={(res) => { setForm(null); ctx.openDoc(res.id) }} />
      <PaymentModal open={!!payment} clientId={payment?.clientId} docId={payment?.docId} amount={payment?.amount} onClose={() => setPayment(null)} />
      {clientId && <ClientProfileModal key={clientId.n} clientId={clientId.id} onClose={() => setClientId(null)} />}
      {docId && <DocDetailModal key={docId.n} docId={docId.id} onClose={() => setDocId(null)} />}
    </WhContext.Provider>
  )
}

export default Wholesale
