import { useState } from 'react'
import { X, Printer, FileText, CreditCard } from 'lucide-react'
import { useSettingsStore } from '../../../store/settingsStore'
import { printPriceList } from '../../../utils/printPriceList'

const FORMATS = [
  {
    id: 'a4',
    label: 'A4',
    size: '210 × 297 mm',
    desc: 'Devorga osish uchun, jadval ko\'rinishi',
    icon: FileText,
  },
  {
    id: 'a5',
    label: 'A5',
    size: '148 × 210 mm',
    desc: 'Mijozga berish, kichikroq format',
    icon: FileText,
  },
  {
    id: 'card',
    label: 'Vitrina tegi',
    size: 'Karta shaklida',
    desc: 'Polka tagiga yopishtiriladi, A4 dan kesib olinadi',
    icon: CreditCard,
  },
]

const CARD_SIZES = [
  { id: 'small',    label: 'Kichik',      size: '54 × 38 mm', hint: 'Bank kartaning yarmi' },
  { id: 'medium',   label: 'O\'rta',      size: '72 × 46 mm', hint: 'Bank kartaning 2/3 qismi' },
  { id: 'bankcard', label: 'Bank karta',  size: '85.6 × 54 mm', hint: 'To\'liq bank karta o\'lchami' },
]

export default function PriceListModal({ products, items, attributeDefs, onClose }) {
  const { companyName, companyLogo } = useSettingsStore()

  const [format, setFormat] = useState('a4')
  const [cardSize, setCardSize] = useState('medium')
  const [showInstallment, setShowInstallment] = useState(false)
  const [onlyInStock, setOnlyInStock] = useState(true)
  const [showStock, setShowStock] = useState(false)

  const previewCount = onlyInStock
    ? products.filter(p => items.some(i => i.productId === p.id && i.status === 'in_stock')).length
    : products.length

  const handlePrint = () => {
    printPriceList({
      products,
      items,
      attributeDefs,
      companyName,
      companyLogo,
      options: { format, cardSize, showInstallment, onlyInStock, showStock },
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-bg-secondary border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-bg-secondary z-10">
          <div className="flex items-center gap-3">
            <Printer size={20} className="text-accent-red" />
            <h2 className="text-lg font-bold text-text-primary">Narxnoma chop etish</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-6">

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
                      active
                        ? 'border-accent-red bg-accent-red/10'
                        : 'border-border bg-bg-tertiary hover:border-text-muted'
                    }`}
                  >
                    <Icon size={18} className={active ? 'text-accent-red' : 'text-text-muted'} />
                    <p className={`font-bold text-sm mt-2 ${active ? 'text-accent-red' : 'text-text-primary'}`}>
                      {f.label}
                    </p>
                    <p className="text-[9px] text-text-muted mt-0.5">{f.size}</p>
                    <p className="text-[9px] text-text-muted mt-1 leading-tight">{f.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Karta o'lchami — faqat card formatida */}
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
                        active
                          ? 'border-accent-blue bg-accent-blue/10'
                          : 'border-border bg-bg-tertiary hover:border-text-muted'
                      }`}
                    >
                      <p className={`font-bold text-sm ${active ? 'text-accent-blue' : 'text-text-primary'}`}>
                        {cs.label}
                      </p>
                      <p className="text-[9px] text-text-muted mt-0.5">{cs.size}</p>
                      <p className="text-[9px] text-text-muted mt-0.5">{cs.hint}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Qo'shimcha sozlamalar */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Sozlamalar</p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-bg-tertiary cursor-pointer hover:bg-bg-primary transition-colors">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={e => setOnlyInStock(e.target.checked)}
                  className="w-4 h-4 accent-accent-red"
                />
                <div>
                  <p className="text-sm text-text-primary">Faqat qoldig'i bor tovarlar</p>
                  <p className="text-[10px] text-text-muted">Stokda yo'q tovarlar chiqmaydi</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-bg-tertiary cursor-pointer hover:bg-bg-primary transition-colors">
                <input
                  type="checkbox"
                  checked={showInstallment}
                  onChange={e => setShowInstallment(e.target.checked)}
                  className="w-4 h-4 accent-accent-red"
                />
                <div>
                  <p className="text-sm text-text-primary">Nasiya narxini ko'rsatish</p>
                  <p className="text-[10px] text-text-muted">Naqd narx yonida nasiya narxi ham chiqadi</p>
                </div>
              </label>

              {format !== 'card' && (
                <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-bg-tertiary cursor-pointer hover:bg-bg-primary transition-colors">
                  <input
                    type="checkbox"
                    checked={showStock}
                    onChange={e => setShowStock(e.target.checked)}
                    className="w-4 h-4 accent-accent-red"
                  />
                  <div>
                    <p className="text-sm text-text-primary">Qoldiq sonini ko'rsatish</p>
                    <p className="text-[10px] text-text-muted">Har bir tovar yonida nechta qolganini ko'rsatadi</p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Xulosa */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-tertiary border border-border">
            <div className="w-2 h-2 rounded-full bg-accent-green flex-shrink-0" />
            <p className="text-sm text-text-secondary">
              <span className="font-bold text-text-primary">{previewCount} ta tovar</span> narxnomaga kiritiladi
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-border sticky bottom-0 bg-bg-secondary">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-border text-text-secondary text-sm font-medium hover:bg-bg-tertiary transition-colors"
          >
            Bekor
          </button>
          <button
            onClick={handlePrint}
            disabled={previewCount === 0}
            className="flex-1 py-3 rounded-xl bg-accent-red text-white text-sm font-bold hover:bg-accent-red/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer size={16} />
            Chop etish
          </button>
        </div>
      </div>
    </div>
  )
}
