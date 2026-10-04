import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Minus, Package, Pencil, Plus, Search, ShoppingBag, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react'
import { getBundles, createBundle, updateBundle, deleteBundle, toggleBundle } from '../../../api/bundleService'

const emptyForm = { name: '', shopId: 'all', discount: 0, products: [] }

const BundlesTab = ({ ctx }) => {
  const { shops, apiProducts } = ctx

  const [bundles, setBundles] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState([])

  const reload = () => getBundles().then(setBundles)

  useEffect(() => { reload() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setProductSearch('')
    setProductResults([])
    setShowModal(true)
  }

  const openEdit = (b) => {
    setEditing(b)
    setForm({ name: b.name, shopId: b.shopId || 'all', discount: b.discount || 0, products: [...b.products] })
    setFormError('')
    setProductSearch('')
    setProductResults([])
    setShowModal(true)
  }

  const handleProductSearch = (q) => {
    setProductSearch(q)
    if (q.length < 1) { setProductResults([]); return }
    const lower = q.toLowerCase()
    const already = new Set(form.products.map(p => String(p.productId)))
    const found = (apiProducts || []).filter(p =>
      !already.has(String(p.id)) &&
      (
        (p.name || '').toLowerCase().includes(lower) ||
        (p.brand || '').toLowerCase().includes(lower) ||
        (p.size || '').toLowerCase().includes(lower)
      )
    ).slice(0, 6)
    setProductResults(found)
  }

  const addProductRow = (product) => {
    setForm(f => ({ ...f, products: [...f.products, { productId: product.id, quantity: 1, productName: product.name }] }))
    setProductSearch('')
    setProductResults([])
  }

  const removeProductRow = (idx) => {
    setForm(f => ({ ...f, products: f.products.filter((_, i) => i !== idx) }))
  }

  const updateQty = (idx, qty) => {
    const q = Math.max(1, Number(qty) || 1)
    setForm(f => ({ ...f, products: f.products.map((p, i) => i === idx ? { ...p, quantity: q } : p) }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError("Nom kiritilmagan"); return }
    if (form.products.length === 0) { setFormError("Kamida bitta tovar qo'shilishi kerak"); return }
    setFormError('')
    const entry = { name: form.name.trim(), shopId: form.shopId, discount: Number(form.discount) || 0, products: form.products }
    if (editing) {
      await updateBundle(editing.id, entry)
    } else {
      await createBundle(entry)
    }
    reload()
    setShowModal(false)
  }

  const handleToggle = async (b) => {
    await toggleBundle(b.id)
    reload()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteBundle(deleteTarget.id)
    setDeleteTarget(null)
    reload()
  }

  const getProductName = (productId) => {
    const p = (apiProducts || []).find(p => String(p.id) === String(productId))
    return p ? p.name : `#${productId}`
  }

  return (
    <motion.div
      key="bundles"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag size={20} className="text-accent-red" />
          <h2 className="text-lg font-syne font-bold text-text-primary">Komplektlar</h2>
          <span className="text-xs text-text-muted bg-bg-secondary border border-border px-2 py-0.5 rounded-full">{bundles.length} ta</span>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-accent-red text-white rounded-xl text-sm font-bold hover:bg-accent-red/90 transition-colors"
        >
          <Plus size={16} /> Yangi komplekt
        </button>
      </div>

      {/* List */}
      {bundles.length === 0 ? (
        <div className="bg-bg-primary border border-border rounded-2xl p-12 text-center">
          <ShoppingBag size={40} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-muted text-sm">Hali komplekt qo'shilmagan</p>
        </div>
      ) : (
        <div className="bg-bg-primary border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-medium text-xs">Nom</th>
                <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-medium text-xs">Do'kon</th>
                <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-medium text-xs">Tovarlar</th>
                <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-medium text-xs">Chegirma</th>
                <th className="text-left px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-medium text-xs">Holat</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3" />
              </tr>
            </thead>
            <tbody>
              {bundles.map((b, i) => (
                <tr key={b.id} className={`border-b border-border/50 hover:bg-bg-secondary/50 transition-colors ${!b.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-3 sm:px-4 py-2 sm:py-3">
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={14} className="text-accent-red flex-shrink-0" />
                      <span className="font-medium text-text-primary">{b.name}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-text-secondary text-xs">
                    {b.shopId === 'all' ? 'Barcha do\'konlar' : (shops || []).find(s => String(s.id) === String(b.shopId))?.name || b.shopId}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3">
                    <div className="flex flex-col gap-0.5">
                      {(b.products || []).map((p, pi) => (
                        <span key={pi} className="text-xs text-text-secondary">
                          {getProductName(p.productId)} × {p.quantity}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3">
                    {b.discount > 0 ? (
                      <span className="text-accent-green font-bold text-xs">-{b.discount}%</span>
                    ) : (
                      <span className="text-text-muted text-xs">—</span>
                    )}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3">
                    <button onClick={() => handleToggle(b)} className="flex items-center gap-1 text-xs">
                      {b.isActive
                        ? <><ToggleRight size={18} className="text-accent-green" /><span className="text-accent-green">Faol</span></>
                        : <><ToggleLeft size={18} className="text-text-muted" /><span className="text-text-muted">Nofaol</span></>
                      }
                    </button>
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(b)} className="p-1.5 hover:bg-bg-tertiary rounded-lg text-text-secondary hover:text-text-primary transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(b)} className="p-1.5 hover:bg-accent-red/10 rounded-lg text-text-secondary hover:text-accent-red transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-lg shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-bg-secondary z-10">
                <h3 className="font-syne font-bold text-text-primary">{editing ? 'Komplektni tahrirlash' : 'Yangi komplekt'}</h3>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-bg-tertiary rounded-lg">
                  <X size={16} className="text-text-secondary" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Nom */}
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">Komplekt nomi *</label>
                  <input
                    className="w-full bg-bg-primary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-red/50"
                    placeholder="Masalan: Qishki to'plam"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>

                {/* Do'kon */}
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">Do'kon</label>
                  <select
                    className="w-full bg-bg-primary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-red/50"
                    value={form.shopId}
                    onChange={e => setForm(f => ({ ...f, shopId: e.target.value }))}
                  >
                    <option value="all">Barcha do'konlar</option>
                    {(shops || []).map(s => (
                      <option key={s.id} value={String(s.id)}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Chegirma */}
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">Chegirma % (ixtiyoriy)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="w-full bg-bg-primary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-red/50"
                    placeholder="0"
                    value={form.discount}
                    onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                  />
                </div>

                {/* Tovar qidiruv */}
                <div>
                  <label className="text-text-secondary text-xs mb-1.5 block">Tovarlar *</label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      className="w-full bg-bg-primary border border-border rounded-xl pl-8 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-red/50"
                      placeholder="Tovar nomini kiriting..."
                      value={productSearch}
                      onChange={e => handleProductSearch(e.target.value)}
                    />
                  </div>
                  {productResults.length > 0 && (
                    <div className="mt-1 bg-bg-primary border border-border rounded-xl overflow-hidden shadow-md">
                      {productResults.map(p => (
                        <button
                          key={p.id}
                          onClick={() => addProductRow(p)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-bg-secondary transition-colors flex items-center gap-2"
                        >
                          <Package size={12} className="text-text-muted flex-shrink-0" />
                          <span className="text-text-primary">{p.name}</span>
                          {p.brand && <span className="text-text-muted text-xs">{p.brand}</span>}
                          {p.size && <span className="text-text-muted text-xs">{p.size}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Qo'shilgan tovarlar */}
                {form.products.length > 0 && (
                  <div className="space-y-2">
                    {form.products.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-bg-primary border border-border rounded-xl px-3 py-2">
                        <Package size={13} className="text-text-muted flex-shrink-0" />
                        <span className="text-sm text-text-primary flex-1 truncate">{getProductName(p.productId)}</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(idx, p.quantity - 1)} className="w-6 h-6 flex items-center justify-center bg-bg-secondary rounded-lg hover:bg-bg-tertiary">
                            <Minus size={10} />
                          </button>
                          <span className="w-6 text-center text-sm font-bold text-text-primary">{p.quantity}</span>
                          <button onClick={() => updateQty(idx, p.quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-bg-secondary rounded-lg hover:bg-bg-tertiary">
                            <Plus size={10} />
                          </button>
                        </div>
                        <button onClick={() => removeProductRow(idx)} className="p-1 hover:bg-accent-red/10 rounded-lg text-text-muted hover:text-accent-red transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {formError && (
                  <div className="flex items-center gap-2 text-accent-red text-xs bg-accent-red/10 rounded-xl px-3 py-2">
                    <AlertCircle size={13} /> {formError}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm text-text-secondary hover:bg-bg-tertiary transition-colors">
                    Bekor
                  </button>
                  <button onClick={handleSave} className="flex-1 py-2.5 bg-accent-red text-white rounded-xl text-sm font-bold hover:bg-accent-red/90 transition-colors">
                    {editing ? 'Saqlash' : 'Qo\'shish'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-bg-secondary border border-border rounded-2xl w-full max-w-sm shadow-2xl z-10 p-4 sm:p-5"
            >
              <h3 className="font-syne font-bold text-text-primary mb-2">Komplektni o'chirish</h3>
              <p className="text-sm text-text-secondary mb-4">
                <span className="font-semibold text-text-primary">"{deleteTarget.name}"</span> o'chirilsinmi?
              </p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 border border-border rounded-xl text-sm text-text-secondary hover:bg-bg-tertiary transition-colors">
                  Bekor
                </button>
                <button onClick={handleDelete} className="flex-1 py-2 bg-accent-red text-white rounded-xl text-sm font-bold hover:bg-accent-red/90 transition-colors">
                  O'chirish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default BundlesTab
