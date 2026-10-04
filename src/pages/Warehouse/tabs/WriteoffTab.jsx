import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, X, CheckCircle, Search, AlertTriangle } from 'lucide-react'
import { useShopStore } from '../../../store/shopStore'
import { useDataStore } from '../../../store/dataStore'
import { getWriteoffs, createWriteoff, addWriteoffExpense } from '../../../api/writeoffService'

const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const WriteoffTab = ({ products, items, batches }) => {
  const { selectedShopId } = useShopStore()
  const { bump } = useDataStore()

  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)

  // Form state
  const [search, setSearch] = useState('')
  const [selProduct, setSelProduct] = useState(null)
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('')
  const [createExpense, setCreateExpense] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [addingExpenseId, setAddingExpenseId] = useState(null)
  const [sortField, setSortField] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const sorted = useMemo(() => {
    return [...list].sort((a, b) => {
      let av = a[sortField], bv = b[sortField]
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [list, sortField, sortDir])

  const handleAddExpense = async (id) => {
    setAddingExpenseId(id)
    try {
      await addWriteoffExpense(id)
      await loadList()
    } catch (err) {
      alert(err?.response?.data?.error || 'Xatolik')
    } finally { setAddingExpenseId(null) }
  }

  const loadList = async () => {
    setLoading(true)
    try { setList(await getWriteoffs(selectedShopId)) } catch { setList([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadList() }, [selectedShopId])

  // Do'kondagi in-stock tovarlar
  const shopBatchIds = useMemo(() => new Set(batches.map(b => b.id)), [batches])
  const stockMap = useMemo(() => {
    const m = {}
    items.forEach(i => {
      if (i.status === 'in_stock' && shopBatchIds.has(i.batchId)) {
        m[i.productId] = (m[i.productId] || 0) + 1
      }
    })
    return m
  }, [items, shopBatchIds])

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase()
    return products
      .filter(p => (stockMap[p.id] || 0) > 0)
      .filter(p => !q || p.name.toLowerCase().includes(q))
      .slice(0, 20)
  }, [products, stockMap, search])

  const openModal = () => {
    setSearch(''); setSelProduct(null); setQty(''); setReason('')
    setCreateExpense(true); setError(''); setSuccess(false)
    setModal(true)
  }

  const handleSubmit = async () => {
    if (!selProduct) return setError('Tovar tanlang')
    const q = parseInt(qty, 10)
    if (!q || q < 1) return setError('Miqdor kiriting')
    const avail = stockMap[selProduct.id] || 0
    if (q > avail) return setError(`Mavjud: ${avail} ta`)
    if (!reason.trim()) return setError('Sabab kiriting')
    setSaving(true); setError('')
    try {
      await createWriteoff({
        productId: selProduct.id,
        shopId: selectedShopId,
        quantity: q,
        reason: reason.trim(),
        createExpense,
      })
      setSuccess(true)
      bump()
      await loadList()
    } catch (err) {
      setError(err?.response?.data?.error || 'Xatolik yuz berdi')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-syne font-bold text-text-primary text-lg">Hisobdan chiqarish</h2>
          <p className="text-sm text-text-muted">Shikastlangan yoki yaroqsiz tovarlarni hisobdan chiqarish</p>
        </div>
        {selectedShopId !== 'all' && (
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent-red text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Trash2 size={16} /> Chiqarish
          </button>
        )}
      </div>

      {/* Jadval */}
      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-accent-red border-t-transparent rounded-full animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-sm">Hisobdan chiqarilgan tovar yo'q</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-tertiary text-text-muted text-xs font-semibold uppercase tracking-wide">
                {[
                  { field: 'createdAt', label: 'Sana', right: false },
                  { field: 'productName', label: 'Tovar', right: false },
                  { field: 'shopName', label: "Do'kon", right: false },
                  { field: 'quantity', label: 'Miqdor', right: true },
                  { field: 'unitPriceUzs', label: 'Dona narxi', right: true },
                  { field: 'totalUzs', label: 'Summa', right: true },
                  { field: 'reason', label: 'Sabab', right: false },
                  { field: 'expenseId', label: 'Xarajat', right: false },
                  { field: 'createdByName', label: 'Kim', right: false },
                ].map(col => (
                  <th
                    key={col.field}
                    onClick={() => handleSort(col.field)}
                    className={`px-4 py-3 cursor-pointer select-none hover:text-text-primary transition-colors ${col.right ? 'text-right' : 'text-left'}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <span className="text-text-muted/50">
                        {sortField === col.field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
                      </span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map(w => (
                <tr key={w.id} className="hover:bg-bg-tertiary/50 transition-colors">
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted whitespace-nowrap">{fmtDate(w.createdAt)}</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-primary font-medium">{w.productName}</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-secondary">{w.shopName}</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-right font-bold text-accent-red">{w.quantity} ta</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-right text-text-secondary">
                    {w.unitPriceUzs > 0 ? w.unitPriceUzs.toLocaleString('uz-UZ') + ' so\'m' : '—'}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-right font-bold text-text-primary">
                    {w.totalUzs > 0 ? w.totalUzs.toLocaleString('uz-UZ') + ' so\'m' : '—'}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-secondary">{w.reason || '—'}</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3">
                    {w.expenseId ? (
                      <span className="text-xs bg-accent-orange/10 text-accent-orange px-2 py-0.5 rounded-lg font-medium">Xarajatga o'tdi</span>
                    ) : w.totalUzs > 0 ? (
                      <button
                        onClick={() => handleAddExpense(w.id)}
                        disabled={addingExpenseId === w.id}
                        className="text-xs bg-accent-blue/10 text-accent-blue px-2 py-1 rounded-lg font-medium hover:bg-accent-blue/20 transition-colors disabled:opacity-60 flex items-center gap-1"
                      >
                        {addingExpenseId === w.id && <div className="w-3 h-3 border border-accent-blue border-t-transparent rounded-full animate-spin" />}
                        + Xarajatga qo'sh
                      </button>
                    ) : (
                      <span className="text-text-muted text-xs">—</span>
                    )}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted text-xs">{w.createdByName || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => !saving && setModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 w-full max-w-md space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-syne font-bold text-text-primary text-lg flex items-center gap-2">
                  <Trash2 size={20} className="text-accent-red" /> Hisobdan chiqarish
                </h3>
                <button onClick={() => setModal(false)} className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-muted"><X size={16} /></button>
              </div>

              {success ? (
                <div className="text-center py-4 sm:py-6 space-y-3">
                  <CheckCircle size={40} className="text-accent-green mx-auto" />
                  <p className="font-bold text-text-primary">Hisobdan chiqarildi!</p>
                  <p className="text-sm text-text-muted">{qty} ta <strong>{selProduct?.name}</strong> muvaffaqiyatli chiqarildi.</p>
                  <div className="flex gap-3 justify-center">
                    <button onClick={() => { setSuccess(false); setSelProduct(null); setQty(''); setReason('') }} className="px-5 py-2 bg-accent-red text-white rounded-xl text-sm font-bold hover:opacity-90">Yana chiqarish</button>
                    <button onClick={() => setModal(false)} className="px-5 py-2 border border-border rounded-xl text-sm font-bold text-text-secondary hover:bg-bg-tertiary">Yopish</button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Tovar qidirish */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Tovar</label>
                    {selProduct ? (
                      <div className="flex items-center justify-between px-3 py-2.5 bg-accent-red/10 border border-accent-red/30 rounded-xl">
                        <span className="text-sm font-bold text-text-primary">{selProduct.name}</span>
                        <button onClick={() => { setSelProduct(null); setQty('') }} className="text-text-muted hover:text-accent-red"><X size={14} /></button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          placeholder="Tovar nomini yozing..."
                          className="w-full pl-8 pr-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-red"
                        />
                        {search && filteredProducts.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-bg-secondary border border-border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                            {filteredProducts.map(p => (
                              <button
                                key={p.id}
                                onClick={() => { setSelProduct(p); setSearch(''); setQty(''); setError('') }}
                                className="w-full text-left px-3 py-2 hover:bg-bg-tertiary text-sm flex items-center justify-between"
                              >
                                <span className="text-text-primary">{p.name}</span>
                                <span className="text-text-muted text-xs">{stockMap[p.id]} ta</span>
                              </button>
                            ))}
                          </div>
                        )}
                        {search && filteredProducts.length === 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-bg-secondary border border-border rounded-xl shadow-lg z-10 px-3 py-2 text-sm text-text-muted">Tovar topilmadi</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Miqdor */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
                      Miqdor {selProduct && <span className="text-accent-red normal-case font-normal">(mavjud: {stockMap[selProduct.id]} ta)</span>}
                    </label>
                    <input
                      type="number" min="1"
                      max={selProduct ? stockMap[selProduct.id] : undefined}
                      value={qty}
                      onChange={e => { setQty(e.target.value); setError('') }}
                      placeholder="Nechta"
                      disabled={!selProduct}
                      className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-red disabled:opacity-50"
                    />
                  </div>

                  {/* Sabab */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Sabab *</label>
                    <textarea
                      value={reason}
                      onChange={e => { setReason(e.target.value); setError('') }}
                      placeholder="Masalan: shikastlangan, eskirgan, yaroqsiz..."
                      rows={2}
                      className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-red resize-none"
                    />
                  </div>

                  {/* Xarajatga o'tkazish */}
                  <label className="flex items-center gap-3 px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl cursor-pointer hover:bg-bg-tertiary/80">
                    <input
                      type="checkbox"
                      checked={createExpense}
                      onChange={e => setCreateExpense(e.target.checked)}
                      className="w-4 h-4 accent-accent-red"
                    />
                    <div>
                      <p className="text-sm font-medium text-text-primary">Xarajatga o'tkazish</p>
                      <p className="text-xs text-text-muted">Tovar qiymati avtomatik xarajat sifatida yoziladi</p>
                    </div>
                  </label>

                  {error && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-accent-red/10 border border-accent-red/30 rounded-xl text-sm text-accent-red">
                      <AlertTriangle size={14} /> {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setModal(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-bold text-text-secondary hover:bg-bg-tertiary transition-colors">Bekor</button>
                    <button
                      onClick={handleSubmit}
                      disabled={saving}
                      className="flex-1 py-2.5 bg-accent-red text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      Hisobdan chiqar
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default WriteoffTab
