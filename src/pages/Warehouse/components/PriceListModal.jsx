import { useState, useMemo } from 'react'
import { X, Printer, FileText, CreditCard } from 'lucide-react'
import { useSettingsStore } from '../../../store/settingsStore'
import { printPriceList } from '../../../utils/printPriceList'

const FORMATS = [
  { id: 'a4',   label: 'A4',           size: '210 × 297 mm',  desc: 'Devorga osish, jadval ko\'rinishi', icon: FileText },
  { id: 'a5',   label: 'A5',           size: '148 × 210 mm',  desc: 'Mijozga berish, kichikroq',          icon: FileText },
  { id: 'card', label: 'Vitrina tegi', size: 'Karta shaklida', desc: 'Polka tagiga yopishtiriladi',        icon: CreditCard },
]

const CARD_SIZES = [
  { id: 'small',    label: 'Kichik',     size: '54 × 38 mm',    hint: 'Bank kartaning yarmi' },
  { id: 'medium',   label: 'O\'rta',     size: '72 × 46 mm',    hint: 'Bank kartaning 2/3' },
  { id: 'bankcard', label: 'Bank karta', size: '85.6 × 54 mm',  hint: 'To\'liq bank karta' },
]

export default function PriceListModal({ products, items, attributeDefs, onClose }) {
  const { companyName, priceListSettings } = useSettingsStore()
  const companyLogo = priceListSettings?.logo ?? null  // narxnoma uchun alohida logo

  const [format, setFormat]               = useState('a4')
  const [cardSize, setCardSize]           = useState('medium')
  const [showInstallment, setShowInstallment] = useState(false)
  const [onlyInStock, setOnlyInStock]     = useState(true)
  const [showStock, setShowStock]         = useState(false)
  const [showAttrs, setShowAttrs]         = useState(true)

  // Boshlang'ich tanlov — barcha mahsulotlar belgilangan
  const [selectedIds, setSelectedIds] = useState(() => new Set(products.map(p => p.id)))

  // 1. Qoldiq filtridan keyin
  const baseList = useMemo(() => {
    if (!onlyInStock) return products
    return products.filter(p => items.some(i => i.productId === p.id && i.status === 'in_stock'))
  }, [products, items, onlyInStock])

  // 2. Visible list = base list (attribute filter yo'q)
  const visibleList = baseList

  // Chop etilishi kerak bo'lgan mahsulotlar
  const selectedVisible = visibleList.filter(p => selectedIds.has(p.id))

  const toggleProduct = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const selectAll  = () => setSelectedIds(new Set(visibleList.map(p => p.id)))
  const selectNone = () => setSelectedIds(new Set())

  const handlePrint = () => {
    printPriceList({
      products: selectedVisible,
      items,
      attributeDefs,
      companyName,
      companyLogo,
      // onlyInStock: false — mahsulotlar allaqachon filtrlangan
      options: { format, cardSize, showInstallment, onlyInStock: false, showStock, showAttrs },
      design: priceListSettings,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-bg-secondary border border-border rounded-2xl w-full max-w-lg flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <Printer size={20} className="text-accent-red" />
            <h2 className="text-lg font-bold text-text-primary">Narxnoma chop etish</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4 sm:space-y-6">

          {/* Format tanlash */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Razmer tanlang</p>
            <div className="grid grid-cols-3 gap-3">
              {FORMATS.map(f => {
                const Icon = f.icon
                const active = format === f.id
                return (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      active ? 'border-accent-red bg-accent-red/10' : 'border-border bg-bg-tertiary hover:border-text-muted'
                    }`}
                  >
                    <Icon size={18} className={active ? 'text-accent-red' : 'text-text-muted'} />
                    <p className={`font-bold text-sm mt-2 ${active ? 'text-accent-red' : 'text-text-primary'}`}>{f.label}</p>
                    <p className="text-[9px] text-text-muted mt-0.5">{f.size}</p>
                    <p className="text-[9px] text-text-muted mt-1 leading-tight">{f.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Karta o'lchami */}
          {format === 'card' && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Karta o'lchami</p>
              <div className="grid grid-cols-3 gap-2">
                {CARD_SIZES.map(cs => {
                  const active = cardSize === cs.id
                  return (
                    <button
                      key={cs.id}
                      onClick={() => setCardSize(cs.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        active ? 'border-accent-blue bg-accent-blue/10' : 'border-border bg-bg-tertiary hover:border-text-muted'
                      }`}
                    >
                      <p className={`font-bold text-sm ${active ? 'text-accent-blue' : 'text-text-primary'}`}>{cs.label}</p>
                      <p className="text-[9px] text-text-muted mt-0.5">{cs.size}</p>
                      <p className="text-[9px] text-text-muted mt-0.5">{cs.hint}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Sozlamalar */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Sozlamalar</p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-bg-tertiary cursor-pointer hover:bg-bg-primary transition-colors">
                <input type="checkbox" checked={onlyInStock} onChange={e => setOnlyInStock(e.target.checked)} className="w-4 h-4 accent-accent-red" />
                <div>
                  <p className="text-sm text-text-primary">Faqat qoldig'i bor tovarlar</p>
                  <p className="text-[10px] text-text-muted">Stokda yo'q tovarlar chiqmaydi</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-bg-tertiary cursor-pointer hover:bg-bg-primary transition-colors">
                <input type="checkbox" checked={showInstallment} onChange={e => setShowInstallment(e.target.checked)} className="w-4 h-4 accent-accent-red" />
                <div>
                  <p className="text-sm text-text-primary">Nasiya narxini ko'rsatish</p>
                  <p className="text-[10px] text-text-muted">Naqd narx yonida nasiya narxi ham chiqadi</p>
                </div>
              </label>
              {format !== 'card' && (
                <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-bg-tertiary cursor-pointer hover:bg-bg-primary transition-colors">
                  <input type="checkbox" checked={showStock} onChange={e => setShowStock(e.target.checked)} className="w-4 h-4 accent-accent-red" />
                  <div>
                    <p className="text-sm text-text-primary">Qoldiq sonini ko'rsatish</p>
                    <p className="text-[10px] text-text-muted">Har bir tovar yonida nechta qolganini ko'rsatadi</p>
                  </div>
                </label>
              )}
              {attributeDefs?.length > 0 && (
                <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-bg-tertiary cursor-pointer hover:bg-bg-primary transition-colors">
                  <input type="checkbox" checked={showAttrs} onChange={e => setShowAttrs(e.target.checked)} className="w-4 h-4 accent-accent-red" />
                  <div>
                    <p className="text-sm text-text-primary">Xususiyatlarni ko'rsatish</p>
                    <p className="text-[10px] text-text-muted">Rim, mavsum va boshqa xususiyatlar chiqadi</p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Tovarlar ro'yxati (checkbox bilan) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                Tovarlar ({visibleList.length} ta)
              </p>
              <div className="flex gap-3">
                <button onClick={selectAll} className="text-xs text-accent-blue hover:underline font-medium">Barchasi</button>
                <span className="text-text-muted text-xs">|</span>
                <button onClick={selectNone} className="text-xs text-text-muted hover:underline font-medium">Hechbiri</button>
              </div>
            </div>
            <div className="border border-border rounded-xl overflow-hidden" style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {visibleList.length === 0 ? (
                <div className="px-4 py-5 sm:py-8 text-center text-sm text-text-muted">Tovar topilmadi</div>
              ) : visibleList.map((p, i) => {
                const checked = selectedIds.has(p.id)
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                      checked ? 'bg-accent-red/5 hover:bg-accent-red/10' : 'hover:bg-bg-tertiary'
                    } ${i > 0 ? 'border-t border-border' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProduct(p.id)}
                      className="w-4 h-4 accent-accent-red flex-shrink-0"
                    />
                    <span className="text-sm text-text-primary flex-1 min-w-0 truncate">{p.name}</span>
                    {p.brand && <span className="text-xs text-text-muted flex-shrink-0">{p.brand}</span>}
                    {p.size  && <span className="text-xs text-text-muted flex-shrink-0">{p.size}</span>}
                  </label>
                )
              })}
            </div>
          </div>

          {/* Xulosa */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-tertiary border border-border">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedVisible.length > 0 ? 'bg-accent-green' : 'bg-accent-red'}`} />
            <p className="text-sm text-text-secondary">
              <span className="font-bold text-text-primary">{selectedVisible.length} ta tovar</span> narxnomaga kiritiladi
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 sm:p-5 border-t border-border flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-border text-text-secondary text-sm font-medium hover:bg-bg-tertiary transition-colors"
          >
            Bekor
          </button>
          <button
            onClick={handlePrint}
            disabled={selectedVisible.length === 0}
            className="flex-1 py-3 rounded-xl bg-accent-red text-white text-sm font-bold hover:bg-accent-red/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer size={16} /> Chop etish ({selectedVisible.length})
          </button>
        </div>
      </div>
    </div>
  )
}
