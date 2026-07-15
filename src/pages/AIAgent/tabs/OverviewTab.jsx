import { useMemo } from 'react'
import { TrendingUp, Megaphone, Users, Package, Activity, UserCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import { MOCK_CALENDAR } from '../../../constants/calendar'
import { TAB_COLORS, fmtNum } from '../aiHelpers'
import AgentActivityFeed from '../components/ActivityFeed'

function getDaysUntilBirthday(birthDate) {
  if (!birthDate) return 999
  const today = new Date()
  const b = new Date(birthDate)
  const next = new Date(today.getFullYear(), b.getMonth(), b.getDate())
  if (next <= today) next.setFullYear(today.getFullYear() + 1)
  return Math.ceil((next - today) / 86400000)
}

function OverviewTab({ onTabChange, aiData = {} }) {
  const { t } = useTranslation()
  const { activities } = useAgentActivityStore()
  const { version } = useDataStore()
  const { selectedShopId } = useShopStore()
  const { sales: _allSales = [], products: MOCK_PRODUCTS = [], items: MOCK_ITEMS = [], batches: _allBatches = [], customers: MOCK_CUSTOMERS = [] } = aiData
  const MOCK_SALES = selectedShopId === 'all' ? _allSales : _allSales.filter(s => s.shopId === selectedShopId)

  const agentStats = useMemo(() => {
    const shopBatches = selectedShopId === 'all' ? _allBatches : _allBatches.filter(b => b.shopId === selectedShopId)
    const shopBatchIds = new Set(shopBatches.map(b => b.id))
    const getShopStock = (productId) => MOCK_ITEMS.filter(i => i.productId === productId && i.status === 'in_stock' && (selectedShopId === 'all' || shopBatchIds.has(i.batchId))).length
    const completedSales = MOCK_SALES.filter(s => s.status === 'completed' && !s._isExchange)
    const totalRevenue = completedSales.reduce((s, x) => s + x.total, 0)
    const inventoryItems = MOCK_PRODUCTS.filter(p => shopBatches.some(b => b.productId === p.id)).map(p => ({ ...p, stock: getShopStock(p.id) }))
    const lowStock = inventoryItems.filter(p => p.stock <= (p.lowStockThreshold || 3)).length

    const brandMap = {}
    completedSales.forEach(sale => sale.items.forEach(item => {
      if (!item.purchasePrice) return
      const brand = MOCK_PRODUCTS.find(p => p.id === item.productId)?.brand || 'Boshqa'
      if (!brandMap[brand]) brandMap[brand] = { revenue: 0, cost: 0 }
      brandMap[brand].revenue += item.salePrice
      brandMap[brand].cost += item.purchasePrice
    }))
    const lowMarginBrands = Object.values(brandMap).filter(b => b.revenue > 0 && (b.revenue - b.cost) / b.revenue * 100 < 20).length

    return [
      {
        id: 'sales', label: t('ai_agent_sales'), Icon: TrendingUp, color: TAB_COLORS.sales,
        stat: fmtNum(totalRevenue, t) + ' ' + t('unit_som'), sub: `${completedSales.length} ${t('ai_sales_count')}`,
        status: lowMarginBrands > 0 ? 'attention' : 'active', alerts: lowMarginBrands,
      },
      {
        id: 'inventory', label: t('ai_agent_inventory'), Icon: Package, color: TAB_COLORS.inventory,
        stat: lowStock + ' ' + t('unit_pcs'), sub: t('ai_low_stock_items'),
        status: lowStock > 0 ? 'attention' : 'active', alerts: lowStock,
      },
      {
        id: 'marketing', label: t('ai_agent_marketing'), Icon: Megaphone, color: TAB_COLORS.marketing,
        stat: MOCK_CALENDAR.length + ' ' + t('unit_pcs'), sub: t('ai_planned_posts'),
        status: 'active', alerts: 0,
      },
      {
        id: 'customer', label: t('ai_agent_customer'), Icon: Users, color: TAB_COLORS.customer,
        stat: MOCK_CUSTOMERS.length + ' ' + t('unit_pcs'), sub: t('ai_active_clients'),
        status: 'active', alerts: MOCK_CUSTOMERS.filter(c => getDaysUntilBirthday(c.birthDate) <= 7).length,
      },
      {
        id: 'staff', label: t('ai_agent_staff'), Icon: UserCheck, color: TAB_COLORS.staff,
        stat: '—', sub: t('ai_staff_activity'),
        status: 'active', alerts: 0,
      },
    ]
  }, [activities, version, t, selectedShopId])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {agentStats.map(({ id, label, Icon, color, stat, sub, status, alerts }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`text-left p-4 rounded-xl border ${color.border} ${color.bg} hover:scale-[1.02] transition-all`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${color.bg} flex items-center justify-center border ${color.border}`}>
                <Icon size={16} className={color.text} />
              </div>
              {alerts > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#E63946]/10 text-[#E63946]">{alerts}</span>
              )}
            </div>
            <p className={`text-xl font-bold font-syne ${color.text}`}>{stat}</p>
            <p className="text-xs text-text-muted mt-0.5">{sub}</p>
            <p className="text-xs text-text-primary mt-2 font-medium truncate">{label}</p>
            <div className="flex items-center gap-1 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${status === 'attention' ? 'bg-amber-400' : 'bg-[#22c55e]'}`} />
              <span className="text-xs text-text-muted">{status === 'attention' ? t('ai_status_attention') : t('ai_status_active')}</span>
            </div>
          </button>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Activity size={15} className="text-purple-400" /> {t('ai_all_activities')}
        </h3>
        <AgentActivityFeed />
      </div>
    </div>
  )
}

export default OverviewTab
