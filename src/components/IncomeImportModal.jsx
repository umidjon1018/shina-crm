import { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Download, Upload, CheckCircle, AlertCircle, AlertTriangle, FileSpreadsheet, ChevronRight, Loader } from 'lucide-react'
import {
  TEMPLATE_COLS, parseExcelFile, analyzeWarnings, isSkippedRow,
  rowToBatchData, mapCategory, generateTemplate,
} from '../utils/excelIncomeImport'
import { getProducts, createProduct } from '../api/productService'
import { addBatch } from '../api/incomeService'

// Yacheyka border rangi
const cellBorder = (level) => {
  if (level === 'red') return 'ring-2 ring-accent-red'
  if (level === 'yellow') return 'ring-2 ring-accent-orange'
  return ''
}

const Tooltip = ({ message, children }) => (
  <div className="relative group inline-block w-full">
    {children}
    {message && (
      <div className="absolute z-50 bottom-full left-0 mb-1 w-56 text-xs bg-bg-primary border border-border rounded-xl px-3 py-2 shadow-lg text-text-primary opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-normal">
        {message}
      </div>
    )}
  </div>
)

export default function IncomeImportModal({ onClose, onSuccess, suppliers, shopId, usdRate, productCategories }) {
  const { t } = useTranslation()
  const [step, setStep] = useState(1)
  const [rows, setRows] = useState([])        // { [colKey]: value }[]
  const [warnings, setWarnings] = useState([]) // warnings[rowIdx][colKey]
  const [editingCell, setEditingCell] = useState(null) // { row, col }
  const [dragOver, setDragOver] = useState(false)
  const [parseError, setParseError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null) // { success, newProducts, skipped, errors }
  const fileRef = useRef()

  // ---- Fayl yuklash ----
  const handleFile = useCallback(async (file) => {
    setParseError('')
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setParseError('Faqat .xlsx, .xls yoki .csv fayl qabul qilinadi')
      return
    }
    try {
      const parsed = await parseExcelFile(file)
      if (!parsed.length) { setParseError('Fayl bo\'sh yoki ma\'lumot topilmadi'); return }
      const w = parsed.map(r => analyzeWarnings(r, usdRate))
      setRows(parsed)
      setWarnings(w)
      setStep(3)
    } catch (err) {
      setParseError(err.message)
    }
  }, [usdRate])

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  // ---- Hujayra tahrirlash ----
  const startEdit = (ri, col) => setEditingCell({ ri, col })

  const commitEdit = (ri, col, val) => {
    setRows(prev => {
      const next = [...prev]
      next[ri] = { ...next[ri], [col]: val }
      return next
    })
    setWarnings(prev => {
      const next = [...prev]
      const newW = analyzeWarnings({ ...rows[ri], [col]: val }, usdRate)
      next[ri] = newW
      return next
    })
    setEditingCell(null)
  }

  // ---- Shablon yuklab olish ----
  const downloadTemplate = () => {
    const blob = generateTemplate()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'kirim_shablon.xlsx'; a.click()
    URL.revokeObjectURL(url)
  }

  // ---- Import ----
  const startImport = async () => {
    setImporting(true)
    const result = { success: 0, newProducts: 0, skipped: 0, errors: [] }

    // Mavjud mahsulotlar
    let products = []
    try { products = await getProducts() } catch {}

    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri]
      const skip = isSkippedRow(row)
      if (skip.skip) { result.skipped++; continue }

      try {
        // 1. Tovarni top yoki yaratish
        const name = String(row.tovar_nomi).trim()
        let product = products.find(p => p.name.trim().toLowerCase() === name.toLowerCase())
        if (!product) {
          const catRaw = row.kategoriya ? String(row.kategoriya).trim().toLowerCase() : ''
          const category = mapCategory(catRaw) || 'accessory'
          product = await createProduct({ name, category })
          products.push(product)
          result.newProducts++
        }

        // 2. Yetkazib beruvchi
        let supplierId = null
        if (row.yetkazib_beruvchi) {
          const sName = String(row.yetkazib_beruvchi).trim().toLowerCase()
          const found = (suppliers || []).find(s => s.name.trim().toLowerCase() === sName)
          if (found) supplierId = found.id
        }

        // 3. Batch yaratish
        const batchData = rowToBatchData(row, product.id, supplierId, shopId, usdRate)
        await addBatch(batchData)
        result.success++
      } catch (err) {
        result.errors.push({ row: ri + 2, name: String(row.tovar_nomi || '').trim(), reason: err?.response?.data?.error || err?.message || 'Xato' })
      }
    }

    setImportResult(result)
    setImporting(false)
    setStep(4)
  }

  // ---- Hisoblar ----
  const skippedRows = rows.filter((r, i) => isSkippedRow(r).skip)
  const validRows = rows.filter((r, i) => !isSkippedRow(r).skip)
  const redCount = warnings.filter((w, i) => !isSkippedRow(rows[i]).skip && Object.values(w).some(x => x.level === 'red')).length
  const yellowCount = warnings.filter((w, i) => !isSkippedRow(rows[i]).skip && Object.values(w).some(x => x.level === 'yellow' && !Object.values(w).some(y => y.level === 'red'))).length
  const newProductCount = rows.filter((r, i) => !isSkippedRow(r).skip).length // approx

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-secondary border border-border rounded-[2rem] w-full max-w-7xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={22} className="text-accent-green" />
            <h2 className="font-syne font-extrabold text-lg text-text-primary">Excel orqali kirim</h2>
          </div>
          {/* Steps */}
          <div className="flex items-center gap-1 text-xs font-bold text-text-muted">
            {['Shablon', 'Yuklash', 'Tekshirish', 'Natija'].map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${step === i + 1 ? 'bg-accent-blue text-white' : step > i + 1 ? 'bg-accent-green text-white' : 'bg-bg-tertiary text-text-muted'}`}>
                  {step > i + 1 ? '✓' : i + 1}
                </span>
                <span className={step === i + 1 ? 'text-text-primary' : ''}>{s}</span>
                {i < 3 && <ChevronRight size={12} />}
              </div>
            ))}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-tertiary rounded-xl"><X size={18} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">

          {/* ===== QADAM 1: Shablon ===== */}
          {step === 1 && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-accent-green/10 rounded-2xl flex items-center justify-center mx-auto">
                <Download size={32} className="text-accent-green" />
              </div>
              <div>
                <h3 className="font-syne font-bold text-xl text-text-primary mb-2">Excel shablonni yuklab oling</h3>
                <p className="text-text-secondary text-sm max-w-md mx-auto">
                  Shablon faylini yuklab oling, ma'lumotlarni to'ldiring va qadam 2 da yuklang.
                  Yulduzcha (*) bilan belgilangan ustunlar majburiy.
                </p>
              </div>
              <div className="bg-bg-tertiary border border-border rounded-2xl p-5 text-left max-w-lg mx-auto">
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Shablon ustunlari</p>
                <div className="space-y-1.5">
                  {TEMPLATE_COLS.map(col => (
                    <div key={col.key} className="flex items-center gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${col.required ? 'bg-accent-red' : col.restrictsSale ? 'bg-accent-orange' : 'bg-accent-green'}`} />
                      <span className="text-text-secondary">{col.label}</span>
                      {col.required && <span className="text-accent-red text-xs ml-auto">majburiy</span>}
                      {col.restrictsSale && !col.required && <span className="text-accent-orange text-xs ml-auto">bo'sh bo'lsa sotilmaydi</span>}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={downloadTemplate} className="inline-flex items-center gap-2 px-6 py-3 bg-accent-green text-white rounded-xl font-bold hover:opacity-90 transition-opacity">
                <Download size={18} /> Shablonni yuklab olish (.xlsx)
              </button>
              <div>
                <button onClick={() => setStep(2)} className="text-sm text-accent-blue hover:underline">
                  Shablonsiz davom etish →
                </button>
              </div>
            </div>
          )}

          {/* ===== QADAM 2: Fayl yuklash ===== */}
          {step === 2 && (
            <div className="space-y-6 py-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${dragOver ? 'border-accent-blue bg-accent-blue/5' : 'border-border hover:border-accent-blue/50'}`}
              >
                <Upload size={40} className="mx-auto mb-4 text-text-muted" />
                <p className="font-bold text-text-primary mb-1">Faylni shu yerga tashlang</p>
                <p className="text-sm text-text-secondary">yoki bosib tanlang</p>
                <p className="text-xs text-text-muted mt-2">.xlsx, .xls, .csv — maksimal 10MB</p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
              </div>
              {parseError && (
                <div className="flex items-center gap-2 text-accent-red text-sm bg-accent-red/10 px-4 py-3 rounded-xl">
                  <AlertCircle size={16} /> {parseError}
                </div>
              )}
            </div>
          )}

          {/* ===== QADAM 3: Ko'rib chiqish ===== */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Xulosa */}
              <div className="flex flex-wrap gap-3">
                <div className="bg-accent-green/10 text-accent-green px-4 py-2 rounded-xl text-sm font-bold">
                  {validRows.length} ta kirim
                </div>
                {redCount > 0 && (
                  <div className="bg-accent-red/10 text-accent-red px-4 py-2 rounded-xl text-sm font-bold">
                    {redCount} ta narxsiz (sotilmaydi)
                  </div>
                )}
                {yellowCount > 0 && (
                  <div className="bg-accent-orange/10 text-accent-orange px-4 py-2 rounded-xl text-sm font-bold">
                    {yellowCount} ta to'liqsiz ma'lumot
                  </div>
                )}
                {skippedRows.length > 0 && (
                  <div className="bg-bg-tertiary text-text-muted px-4 py-2 rounded-xl text-sm font-bold">
                    {skippedRows.length} ta o'tkazib yuboriladi
                  </div>
                )}
              </div>

              <p className="text-xs text-text-muted">
                🔴 Qizil — narx kiritilmagan (narx kiritilgunga qadar sotilmaydi) &nbsp;·&nbsp;
                🟡 Sariq — tavsiya etilgan ma'lumot yo'q &nbsp;·&nbsp;
                Yacheykani bosib tahrirlash mumkin
              </p>

              {/* Jadval */}
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-bg-tertiary text-text-muted uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-3 text-left w-8">#</th>
                      {TEMPLATE_COLS.map(col => (
                        <th key={col.key} className="px-3 py-3 text-left whitespace-nowrap">{col.label.split('(')[0].trim()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {rows.map((row, ri) => {
                      const skip = isSkippedRow(row)
                      const rowW = warnings[ri] || {}
                      return (
                        <tr key={ri} className={`${skip.skip ? 'opacity-40' : 'hover:bg-bg-tertiary/30'}`}>
                          <td className="px-3 py-2 text-text-muted">{ri + 1}</td>
                          {TEMPLATE_COLS.map(col => {
                            const w = rowW[col.key]
                            const isEditing = editingCell?.ri === ri && editingCell?.col === col.key
                            const val = row[col.key] !== undefined ? String(row[col.key]) : ''
                            return (
                              <td key={col.key} className="px-2 py-1.5">
                                {isEditing ? (
                                  <input
                                    autoFocus
                                    defaultValue={val}
                                    onBlur={e => commitEdit(ri, col.key, e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(ri, col.key, e.target.value); if (e.key === 'Escape') setEditingCell(null) }}
                                    className="w-full min-w-[80px] bg-bg-primary border border-accent-blue rounded-lg px-2 py-1 text-xs focus:outline-none"
                                  />
                                ) : (
                                  <Tooltip message={w?.message}>
                                    <div
                                      onClick={() => startEdit(ri, col.key)}
                                      className={`min-w-[60px] min-h-[24px] px-2 py-1 rounded-lg cursor-pointer transition-all hover:bg-bg-tertiary ${w ? cellBorder(w.level) : ''}`}
                                    >
                                      {val || <span className="text-text-muted/40">—</span>}
                                    </div>
                                  </Tooltip>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button onClick={() => { setStep(2); setRows([]); setWarnings([]) }} className="text-sm text-text-muted hover:text-text-primary">← Boshqa fayl</button>
                <button
                  onClick={startImport}
                  disabled={validRows.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-accent-blue text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Import qilish ({validRows.length} ta)
                </button>
              </div>
            </div>
          )}

          {/* ===== QADAM 4: Import ===== */}
          {step === 4 && (
            <div className="py-6 space-y-6">
              {importing ? (
                <div className="text-center space-y-4">
                  <div className="w-14 h-14 mx-auto border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
                  <p className="text-text-secondary font-medium">Import qilinmoqda...</p>
                </div>
              ) : importResult && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-accent-green/10 rounded-2xl flex items-center justify-center">
                      <CheckCircle size={28} className="text-accent-green" />
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary">Import yakunlandi</h3>
                      <p className="text-sm text-text-secondary">Kirimlar ro'yxatida ko'rish mumkin</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-accent-green/10 rounded-xl p-4 text-center">
                      <p className="text-2xl font-extrabold text-accent-green">{importResult.success}</p>
                      <p className="text-xs text-text-muted mt-1">Muvaffaqiyatli</p>
                    </div>
                    <div className="bg-accent-blue/10 rounded-xl p-4 text-center">
                      <p className="text-2xl font-extrabold text-accent-blue">{importResult.newProducts}</p>
                      <p className="text-xs text-text-muted mt-1">Yangi tovar qo'shildi</p>
                    </div>
                    <div className="bg-bg-tertiary rounded-xl p-4 text-center">
                      <p className="text-2xl font-extrabold text-text-muted">{importResult.skipped}</p>
                      <p className="text-xs text-text-muted mt-1">O'tkazib yuborildi</p>
                    </div>
                    <div className="bg-accent-red/10 rounded-xl p-4 text-center">
                      <p className="text-2xl font-extrabold text-accent-red">{importResult.errors.length}</p>
                      <p className="text-xs text-text-muted mt-1">Xato</p>
                    </div>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="bg-accent-red/5 border border-accent-red/20 rounded-xl p-4 space-y-1">
                      <p className="text-xs font-bold text-accent-red mb-2">Xato qatorlar:</p>
                      {importResult.errors.map((e, i) => (
                        <p key={i} className="text-xs text-text-secondary">
                          <span className="font-bold">{e.row}-qator "{e.name}":</span> {e.reason}
                        </p>
                      ))}
                    </div>
                  )}
                  {importResult.newProducts > 0 && (
                    <div className="flex items-start gap-2 text-sm text-accent-orange bg-accent-orange/10 px-4 py-3 rounded-xl">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <p>{importResult.newProducts} ta yangi tovar Management → Tovarlar ro'yxatiga qo'shildi. Narx va boshqa ma'lumotlarni Admin/Boshqaruvchi keyinchalik to'ldiradi.</p>
                    </div>
                  )}
                  <button
                    onClick={() => { onSuccess?.(); onClose() }}
                    className="w-full py-3 bg-accent-blue text-white rounded-xl font-bold hover:opacity-90"
                  >
                    Yopish
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer nav — faqat 1-2 qadam */}
        {step <= 2 && (
          <div className="px-8 py-4 border-t border-border shrink-0 flex justify-between items-center">
            {step === 1 ? (
              <span />
            ) : (
              <button onClick={() => setStep(s => s - 1)} className="text-sm text-text-muted hover:text-text-primary">← Orqaga</button>
            )}
            {step === 1 && (
              <button onClick={() => setStep(2)} className="flex items-center gap-2 px-6 py-2.5 bg-accent-blue text-white rounded-xl font-bold hover:opacity-90">
                Fayl yuklash →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
