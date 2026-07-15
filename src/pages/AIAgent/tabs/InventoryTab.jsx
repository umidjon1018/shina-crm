import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Package, Zap, CheckCircle, MessageSquare, Activity } from 'lucide-react'
import AiChat from '../components/AiChat'
import { useTranslation } from 'react-i18next'
import { useAgentActivityStore } from '../../../store/agentActivityStore'
import { useDataStore } from '../../../store/dataStore'
import { useShopStore } from '../../../store/shopStore'
import { fmtTime } from '../aiHelpers'
import AgentActivityFeed from '../components/ActivityFeed'

const SEASON_RULES = {
  SUMMER: { startMonths: [3, 4], endMonths: [8, 9] },
  WINTER: { startMonths: [9, 10], endMonths: [2, 3] },
  ALL_SEASON: { startMonths: [], endMonths: [] },
  NA: { startMonths: [], endMonths: [] },
}

function getSeasonStatus(season, month) {
  const rules = SEASON_RULES[season]
  if (!rules) return 'neutral'
  if (rules.startMonths.includes(month)) return 'starting'
  if (rules.endMonths.includes(month)) return 'ending'
  return 'neutral'
}

function InventoryTab({ aiData = {} }) {
  const { t } = useTranslation()
  const { addActivity, getActivitiesByAgent } = useAgentActivityStore()
  const { version } = useDataStore()
  const { selectedShopId } = useShopStore()
  const { sales: _allSales = [], products: MOCK_PRODUCTS = [], items: MOCK_ITEMS = [], batches: MOCK_BATCHES = [] } = aiData
  const MOCK_SALES = selectedShopId === 'all' ? _allSales : _allSales.filter(s => s.shopId === selectedShopId)
  const [confirmed, setConfirmed] = useState({})
  const now = new Date()
  const currentMonth = now.getMonth() + 1

  const inventoryData = useMemo(() => {
    const _shopBatches = selectedShopId === 'all' ? MOCK_BATCHES : MOCK_BATCHES.filter(b => b.shopId === selectedShopId)
    const _shopBatchIds = new Set(_shopBatches.map(b => b.id))
    const getShopStock = (productId) => MOCK_ITEMS.filter(i => i.productId === productId && i.status === 'in_stock' && (selectedShopId === 'all' || _shopBatchIds.has(i.batchId))).length
    const WINDOW_DAYS = 90
    const windowStart = new Date(Date.now() - WINDOW_DAYS * 86400000)

    return MOCK_PRODUCTS.filter(p => p.isActive && _shopBatches.some(b => b.productId === p.id)).map(product => {
      const stock = getShopStock(product.id)
      const productSales = MOCK_SALES.filter(
        s => s.status === 'completed' && !s._isExchange && s.items.some(i => i.productId === product.id)
      )
      const soldInWindow = productSales
        .filter(s => new Date(s.soldAt) >= windowStart)
        .reduce((sum, s) => sum + s.items.filter(i => i.productId === product.id).length, 0)
      const soldLast30 = Math.round(soldInWindow * 30 / WINDOW_DAYS)
      const dailyRate = soldInWindow / WINDOW_DAYS
      const daysLeft = dailyRate > 0 ? Math.floor(stock / dailyRate) : null
      const seasonStatus = getSeasonStatus(product.season, currentMonth)
      const minLimit = product.lowStockThreshold || 3
      const reorderQty = Math.ceil(soldInWindow * 2)

      let recommendation = null
      if (stock <= minLimit) {
        if (soldLast30 >= 3) {
          if (seasonStatus === 'ending') recommendation = { type: 'warning', textKey: 'ai_rec_text_no_order', qty: 0 }
          else if (seasonStatus === 'starting') recommendation = { type: 'urgent', textKey: 'ai_rec_text_urgent', qty: Math.max(reorderQty, 10) }
          else recommendation = { type: 'order', textKey: 'ai_rec_text_order', qty: reorderQty || 6 }
        } else {
          if (seasonStatus === 'starting') recommendation = { type: 'consider', textKey: 'ai_rec_text_consider', qty: reorderQty || 4 }
          else recommendation = { type: 'neutral', textKey: 'ai_rec_text_low_sales', qty: 0 }
        }
      } else if (soldLast30 >= 5 && stock <= minLimit * 3) {
        recommendation = { type: 'watch', textKey: 'ai_rec_text_watch', qty: 0 }
      }

      return { product, stock, soldLast30, dailyRate, daysLeft, seasonStatus, minLimit, recommendation }
    })
  }, [currentMonth, version, selectedShopId])

  const bookingActivities = getActivitiesByAgent('inventory').filter(a => a.type === 'BOOKING')

  const handleConfirm = (item) => {
    setConfirmed(prev => ({ ...prev, [item.product.id]: true }))
    addActivity({
      agentId: 'inventory',
      type: 'RECOMMENDATION',
      message: t('ai_activity_order_confirmed', { product: item.product.name, qty: item.recommendation.qty }),
      relatedAgentId: null,
      relatedEntity: { type: 'product', id: item.product.id },
    })
  }

  const recTypeStyle = {
    urgent:   'border-[#E63946]/50 bg-[#E63946]/5',
    order:    'border-[#22c55e]/50 bg-[#22c55e]/5',
    warning:  'border-amber-500/50 bg-amber-500/5',
    consider: 'border-[#f97316]/50 bg-[#f97316]/5',
    watch:    'border-[#3b82f6]/50 bg-[#3b82f6]/5',
    neutral:  'border-border bg-bg-secondary',
  }
  const recBadge = {
    urgent:   'text-[#E63946] bg-[#E63946]/10',
    order:    'text-[#22c55e] bg-[#22c55e]/10',
    warning:  'text-amber-400 bg-amber-400/10',
    consider: 'text-[#f97316] bg-[#f97316]/10',
    watch:    'text-[#3b82f6] bg-[#3b82f6]/10',
    neutral:  'text-text-muted bg-bg-secondary',
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Package size={15} className="text-[#E63946]" /> {t('ai_inventory_status')}
        </h3>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                {[t('product'), t('wh_stock_qty'), t('ai_inv_col_min'), t('ai_inv_col_sold30'), t('wh_daily'), t('wh_days_left'), t('season')].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-text-muted font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventoryData.map(({ product, stock, soldLast30, dailyRate, daysLeft, seasonStatus, minLimit }) => (
                <tr key={product.id} className="border-b border-border/50 hover:bg-bg-secondary/50 transition-colors">
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-text-primary">{product.name}</p>
                    <p className="text-text-muted">{product.brand}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`font-bold ${stock <= minLimit ? 'text-[#E63946]' : stock <= minLimit * 2 ? 'text-amber-400' : 'text-[#22c55e]'}`}>
                      {stock} {t('unit_pcs')}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-text-muted">{minLimit} {t('unit_pcs')}</td>
                  <td className="px-3 py-2.5 text-text-primary">{soldLast30} {t('unit_pcs')}</td>
                  <td className="px-3 py-2.5 text-text-muted">{dailyRate.toFixed(2)}/{t('ai_unit_day')}</td>
                  <td className="px-3 py-2.5">
                    {daysLeft === null
                      ? <span className="text-text-muted">—</span>
                      : <span className={daysLeft < 14 ? 'text-[#E63946] font-medium' : daysLeft < 30 ? 'text-amber-400' : 'text-text-primary'}>
                          {daysLeft} {t('ai_unit_day')}
                        </span>
                    }
                  </td>
                  <td className="px-3 py-2.5">
                    {product.season === 'NA' ? <span className="text-text-muted">—</span> : (
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        seasonStatus === 'starting' ? 'text-[#22c55e] bg-[#22c55e]/10' :
                        seasonStatus === 'ending' ? 'text-[#E63946] bg-[#E63946]/10' :
                        'text-text-muted bg-bg-secondary'
                      }`}>
                        {t('season_' + product.season)}
                        {seasonStatus === 'starting' && ' ↑'}
                        {seasonStatus === 'ending' && ' ↓'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {inventoryData.some(d => d.recommendation) && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Zap size={15} className="text-amber-400" /> {t('ai_agent_recommendations')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {inventoryData.filter(d => d.recommendation).map(item => (
              <motion.div
                key={item.product.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border ${recTypeStyle[item.recommendation.type]}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-text-primary text-sm">{item.product.name}</p>
                    <p className="text-xs text-text-muted mt-0.5">{item.product.brand} · {t('ai_stock_left')}: {item.stock} {t('unit_pcs')}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${recBadge[item.recommendation.type]}`}>
                    {item.recommendation.type === 'urgent' ? t('ai_rec_urgent') :
                     item.recommendation.type === 'order' ? t('ai_rec_order') :
                     item.recommendation.type === 'warning' ? t('warning') :
                     item.recommendation.type === 'consider' ? t('ai_rec_consider') :
                     item.recommendation.type === 'watch' ? t('ai_rec_watch') : t('ai_rec_neutral')}
                  </span>
                </div>
                <p className="text-sm text-text-primary mt-2">{t(item.recommendation.textKey)}</p>
                {item.recommendation.qty > 0 && (
                  <p className="text-xs text-text-muted mt-1">{t('ai_rec_qty')}: <strong>{item.recommendation.qty} {t('unit_pcs')}</strong></p>
                )}
                {item.recommendation.qty > 0 && (
                  confirmed[item.product.id]
                    ? <p className="mt-3 text-xs text-[#22c55e] flex items-center gap-1"><CheckCircle size={12} /> {t('ai_confirmed')}</p>
                    : (
                      <button
                        onClick={() => handleConfirm(item)}
                        className="mt-3 text-xs px-3 py-1.5 rounded-lg bg-bg-primary border border-border hover:bg-bg-secondary text-text-primary transition-colors"
                      >
                        {t('ai_confirm_demo')}
                      </button>
                    )
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {bookingActivities.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <MessageSquare size={15} className="text-purple-400" /> {t('ai_bookings_from_customer')}
          </h3>
          <div className="space-y-2">
            {bookingActivities.map(a => (
              <div key={a.id} className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/5">
                <p className="text-sm text-text-primary">{a.message}</p>
                <p className="text-xs text-text-muted mt-1">{fmtTime(a.timestamp, t)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Activity size={15} className="text-[#E63946]" /> {t('ai_recent_actions')}
        </h3>
        <AgentActivityFeed agentId="inventory" />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <MessageSquare size={15} className="text-[#E63946]" /> AI Agent — Ombor maslahatchi
        </h3>
        <AiChat
          agentId="product-agent"
          systemPrompt={`Sen GoodTires omborxona va tovar agentisan.

📦 Hozirgi zaxira holati:
${inventoryData.slice(0, 15).map(d =>
  `  ${d.product.name} (${d.product.brand}): ${d.stock} dona qoldi, 30 kunda ${d.soldLast30} ta sotilgan${d.daysLeft !== null ? `, ${d.daysLeft} kun yetadi` : ''}`
).join('\n')}

⚠️ Tavsiya kerak bo'lganlar:
${inventoryData.filter(d => d.recommendation).map(d =>
  `  ${d.product.name}: ${d.stock} dona, holat: ${d.recommendation.type}`
).join('\n') || '  Hozircha yo\'q'}

MUHIM QOIDALAR:
- To'liq, to'g'ri o'zbek adabiy tilida yoz. Grammatika: ega + to'ldiruvchi + kesim tartibida.
- "Bu tovar tez tugaydi" — to'g'ri. "Tez tugaydi bu tovar" — NOTO'G'RI.
- Buyurtma, zaxira, mavsum bo'yicha amaliy maslahat ber.
- Markdown ishlatishingiz mumkin: **qalin**, - ro'yxat, ## sarlavha.`}
          placeholder="Zaxira, buyurtma, mavsum haqida so'rang..."
          colorClass="accent-red"
        />
      </div>
    </div>
  )
}

export default InventoryTab
