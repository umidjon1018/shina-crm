import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Tag, Printer, Eye, Layers, Hash, X, AlertCircle, Download } from 'lucide-react'
import { generateBarcodes, updateBarcodeStatus, findExistingGroupBarcode } from '../../../api/itemService'
import { getItemStatus } from '../../../utils/itemStatus'
import JsBarcode from 'jsbarcode'
import { Badge, isPrivileged } from '../whHelpers.jsx'

const AttrBadges = ({ attributes }) => {
  if (!attributes || Object.keys(attributes).length === 0) return null
  return (
    <div className="flex flex-wrap gap-1">
      {Object.entries(attributes).map(([k, v]) => (
        <span key={k} className="px-1.5 py-0.5 rounded-md bg-bg-tertiary border border-border text-[10px] text-text-secondary">
          {k}: <span className="text-text-primary font-medium">{v}</span>
        </span>
      ))}
    </div>
  )
}

const renderBarcodeSvg = (elementId, barcodeValue) => {
  setTimeout(() => {
    try {
      JsBarcode(`#${elementId}`, barcodeValue, {
        format: 'CODE128', width: 1.5, height: 40,
        displayValue: true, fontSize: 10, margin: 6,
        background: 'transparent', lineColor: 'currentColor',
      })
    } catch {}
  }, 80)
}

const createBarcodeSvgHtml = (barcodeValue) => {
  return new Promise(resolve => {
    const div = document.createElement('div')
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const id = `_temp_bc_${Date.now()}_${Math.random().toString(36).slice(2)}`
    svg.setAttribute('id', id)
    div.style.position = 'absolute'
    div.style.left = '-9999px'
    div.appendChild(svg)
    document.body.appendChild(div)
    setTimeout(() => {
      try {
        JsBarcode(`#${id}`, barcodeValue, {
          format: 'CODE128', width: 1.5, height: 40,
          displayValue: true, fontSize: 10, margin: 6,
          background: '#0F1520', lineColor: '#ffffff',
        })
        const html = div.innerHTML
        document.body.removeChild(div)
        resolve(html)
      } catch {
        document.body.removeChild(div)
        resolve('')
      }
    }, 80)
  })
}

const BarcodeTab = ({ products, batches = [], items, userRole, userId, userName, downloadEnabled, notificationSettings, addNotification, onRefresh }) => {
  const { t } = useTranslation()
  const barcodeSelectClass = userRole === 'admin' ? '' : 'select-none'

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productSearch, setProductSearch] = useState('')
  const [generatingBatch, setGeneratingBatch] = useState(null)
  const [mergeDialog, setMergeDialog] = useState(null)
  const [detailModal, setDetailModal] = useState(null) // batch object
  const pendingGenerate = useRef(null)

  const [allBarcodesSearch, setAllBarcodesSearch] = useState('')
  const [allBarcodesPage, setAllBarcodesPage] = useState(1)
  const ALL_BARCODES_PER_PAGE = 30

  const [soldBarcodesPage, setSoldBarcodesPage] = useState(1)
  const [soldBarcodesSearch, setSoldBarcodesSearch] = useState('')
  const SOLD_PER_PAGE = 10

  const [sort1Field, setSort1Field] = useState(null)
  const [sort1Dir, setSort1Dir] = useState('asc')
  const [sort2Field, setSort2Field] = useState(null)
  const [sort2Dir, setSort2Dir] = useState('asc')

  const handleSort1 = (field) => {
    if (sort1Field === field) setSort1Dir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSort1Field(field); setSort1Dir('asc') }
    setAllBarcodesPage(1)
  }
  const handleSort2 = (field) => {
    if (sort2Field === field) setSort2Dir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSort2Field(field); setSort2Dir('asc') }
    setSoldBarcodesPage(1)
  }

  const SortIcon = ({ field, sortField, sortDir }) => {
    if (sortField !== field) return <span className="text-text-muted ml-1 text-[10px] inline-block">⇅</span>
    return <span className="text-accent-blue ml-1 text-[10px] inline-block">{sortDir === 'asc' ? '▲' : '▼'}</span>
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.brand || '').toLowerCase().includes(productSearch.toLowerCase())
  )

  const productBatches = useMemo(() =>
    batches.filter(b => b.productId === selectedProduct?.id),
    [batches, selectedProduct]
  )

  const getBatchItems = (batchId) =>
    items.filter(i => i.batchId === batchId && i.status === 'in_stock')

  const getBatchBarcodeState = (batchId) => {
    const bItems = getBatchItems(batchId)
    const withBarcode = bItems.filter(i => i.barcode)
    const withoutBarcode = bItems.filter(i => !i.barcode)
    const uniqueBarcodes = [...new Set(withBarcode.map(i => i.barcode))]
    const isGroup = uniqueBarcodes.length === 1 && withBarcode.length > 1
    const isPerItem = uniqueBarcodes.length > 1
    const isSingle = uniqueBarcodes.length === 1 && withBarcode.length === 1
    return { bItems, withBarcode, withoutBarcode, uniqueBarcodes, isGroup, isPerItem, isSingle }
  }

  // Batch kartadagi group barkod SVG larini render qilish
  useEffect(() => {
    productBatches.forEach(batch => {
      const { uniqueBarcodes, isGroup, isSingle } = getBatchBarcodeState(batch.id)
      if ((isGroup || isSingle) && uniqueBarcodes[0]) {
        renderBarcodeSvg(`bc-grp-${batch.id}`, uniqueBarcodes[0])
      }
    })
  }, [productBatches, items])

  // Detail modal SVG render
  useEffect(() => {
    if (!detailModal) return
    const { uniqueBarcodes, isGroup, isSingle } = getBatchBarcodeState(detailModal.id)
    if ((isGroup || isSingle) && uniqueBarcodes[0]) {
      setTimeout(() => {
        try {
          JsBarcode('#modal-group-bc', uniqueBarcodes[0], {
            format: 'CODE128', width: 2, height: 60,
            displayValue: true, fontSize: 12, margin: 8,
            background: 'transparent', lineColor: 'currentColor',
          })
        } catch {}
      }, 150)
    }
  }, [detailModal, items])

  // === Generate handlers ===

  const doGenerate = async (batchId, itemIds, mode, baseBarcode = null) => {
    setGeneratingBatch(batchId)
    try {
      await generateBarcodes(itemIds, userId, { mode, baseBarcode: baseBarcode || undefined })
      onRefresh?.()
    } finally {
      setGeneratingBatch(null)
    }
  }

  const handleGenerateGroup = async (batch) => {
    const { withoutBarcode } = getBatchBarcodeState(batch.id)
    const itemIds = withoutBarcode.map(i => i.id)
    if (!itemIds.length) return
    const existing = await findExistingGroupBarcode(batch.productId, batch.attributes || {})
    if (existing.length > 0) {
      pendingGenerate.current = { batchId: batch.id, itemIds, mode: 'group' }
      setMergeDialog({ batchId: batch.id, existingBarcodes: existing, attributes: batch.attributes || {} })
      return
    }
    await doGenerate(batch.id, itemIds, 'group')
  }

  const handleGeneratePerItem = async (batch) => {
    const { withoutBarcode } = getBatchBarcodeState(batch.id)
    const itemIds = withoutBarcode.map(i => i.id)
    if (!itemIds.length) return
    await doGenerate(batch.id, itemIds, 'per_item')
  }

  const handleMergeConfirm = async (baseBarcode) => {
    const pg = pendingGenerate.current
    if (!pg) return
    setMergeDialog(null)
    pendingGenerate.current = null
    await doGenerate(pg.batchId, pg.itemIds, 'group', baseBarcode)
  }

  const handleMergeNew = async () => {
    const pg = pendingGenerate.current
    if (!pg) return
    setMergeDialog(null)
    pendingGenerate.current = null
    await doGenerate(pg.batchId, pg.itemIds, 'group', null)
  }

  // === Print handlers ===

  const handlePrintGroup = async (batch) => {
    const { uniqueBarcodes, withBarcode } = getBatchBarcodeState(batch.id)
    const bc = uniqueBarcodes[0]
    if (!bc) return
    const svgHtml = await createBarcodeSvgHtml(bc)
    if (!svgHtml) return
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html><body style="margin:16px;background:#0F1520;">
        <div style="margin-bottom:8px;font-family:monospace;color:#aaa;font-size:12px;">
          ${selectedProduct?.name || ''} — Umumiy barkod · ${withBarcode.length} ta uchun
        </div>
        <div style="background:#0F1520;display:inline-block;padding:4px;">${svgHtml}</div>
      </body></html>
    `)
    printWindow.document.close()
    printWindow.print()
    printWindow.close()
    await updateBarcodeStatus(withBarcode.map(i => i.id), { status: 'printed', reprintAllowed: false })
    onRefresh?.()
  }

  const handleDownloadBarcode = (barcodeValue) => {
    try {
      const canvas = document.createElement('canvas')
      JsBarcode(canvas, barcodeValue, {
        format: 'CODE128', width: 2, height: 60,
        displayValue: true, fontSize: 12, margin: 10,
        background: '#ffffff', lineColor: '#000000',
      })
      canvas.toBlob(blob => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `barcode-${barcodeValue}.png`
        a.click()
        URL.revokeObjectURL(url)
      })
    } catch {}
  }

  const handlePrintPerItem = async (batch) => {
    const { withBarcode } = getBatchBarcodeState(batch.id)
    const barcodes = withBarcode.map(i => i.barcode)
    if (!barcodes.length) return
    const svgHtmlParts = await Promise.all(barcodes.map(createBarcodeSvgHtml))
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html><body style="margin:0;background:#0F1520;display:flex;flex-wrap:wrap;gap:8px;padding:8px;">
        ${svgHtmlParts.map(s => `<div style="background:#0F1520;padding:4px;">${s}</div>`).join('')}
      </body></html>
    `)
    printWindow.document.close()
    printWindow.print()
    printWindow.close()
    await updateBarcodeStatus(withBarcode.map(i => i.id), { status: 'printed', reprintAllowed: false })
    onRefresh?.()
  }

  // === "Barcha barkodlar" jadval ===

  const allBarcodeItems = items
    .filter(item => item.status !== 'sold')
    .map(item => {
      const prod = products.find(p => p.id === item.productId)
      return {
        ...item,
        productName: item.productName || (prod ? prod.name : 'Noma\'lum'),
        batchDate: item.createdAt || null,
      }
    })
    .filter(item =>
      allBarcodesSearch === '' ||
      item.productName.toLowerCase().includes(allBarcodesSearch.toLowerCase()) ||
      (item.barcode || '').toLowerCase().includes(allBarcodesSearch.toLowerCase())
    )

  const sortedAllBarcodes = useMemo(() => {
    if (!sort1Field) return allBarcodeItems
    return [...allBarcodeItems].sort((a, b) => {
      let av = '', bv = ''
      if (sort1Field === 'batchDate') { av = a.batchDate || ''; bv = b.batchDate || '' }
      else if (sort1Field === 'barcodeDate') { av = a.barcodeCreatedAt || ''; bv = b.barcodeCreatedAt || '' }
      else if (sort1Field === 'status') { av = a.status || ''; bv = b.status || '' }
      else if (sort1Field === 'productName') { av = a.productName || ''; bv = b.productName || '' }
      else { av = String(a[sort1Field] || ''); bv = String(b[sort1Field] || '') }
      return sort1Dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [allBarcodeItems, sort1Field, sort1Dir])

  const allBarcodesTotalPages = Math.ceil(sortedAllBarcodes.length / ALL_BARCODES_PER_PAGE)
  const allBarcodesPagedItems = sortedAllBarcodes.slice(
    (allBarcodesPage - 1) * ALL_BARCODES_PER_PAGE,
    allBarcodesPage * ALL_BARCODES_PER_PAGE
  )

  const soldBarcodeItems = items
    .filter(item => item.status === 'sold' && item.barcode)
    .map(item => {
      const prod = products.find(p => p.id === item.productId)
      return {
        ...item,
        productName: item.productName || (prod ? prod.name : 'Noma\'lum'),
        batchDate: item.createdAt || null,
      }
    })
    .filter(item =>
      soldBarcodesSearch === '' ||
      item.productName.toLowerCase().includes(soldBarcodesSearch.toLowerCase()) ||
      (item.barcode || '').toLowerCase().includes(soldBarcodesSearch.toLowerCase())
    )

  const sortedSoldBarcodes = useMemo(() => {
    if (!sort2Field) return soldBarcodeItems
    return [...soldBarcodeItems].sort((a, b) => {
      let av = '', bv = ''
      if (sort2Field === 'batchDate') { av = a.batchDate || ''; bv = b.batchDate || '' }
      else if (sort2Field === 'barcodeDate') { av = a.barcodeCreatedAt || ''; bv = b.barcodeCreatedAt || '' }
      else if (sort2Field === 'status') { av = a.status || ''; bv = b.status || '' }
      else if (sort2Field === 'productName') { av = a.productName || ''; bv = b.productName || '' }
      else { av = String(a[sort2Field] || ''); bv = String(b[sort2Field] || '') }
      return sort2Dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [soldBarcodeItems, sort2Field, sort2Dir])

  const soldTotalPages = Math.ceil(sortedSoldBarcodes.length / SOLD_PER_PAGE)
  const soldPagedItems = sortedSoldBarcodes.slice(
    (soldBarcodesPage - 1) * SOLD_PER_PAGE,
    soldBarcodesPage * SOLD_PER_PAGE
  )

  return (
    <>
      {/* Merge Dialog */}
      <AnimatePresence>
        {mergeDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => { setMergeDialog(null); pendingGenerate.current = null }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-bg-secondary border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle size={20} className="text-accent-orange flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-syne font-bold text-text-primary">Barkod allaqachon mavjud</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Bu mahsulot va xususiyatlar uchun umumiy barkod oldindan yaratilgan.
                  </p>
                </div>
              </div>
              {mergeDialog.existingBarcodes.length > 0 && (
                <div className="bg-bg-tertiary rounded-xl p-3 mb-4 space-y-2">
                  {mergeDialog.existingBarcodes.map(bc => (
                    <div key={bc} className="flex items-center justify-between">
                      <span className="font-mono text-sm text-accent-green">{bc}</span>
                      <button
                        onClick={() => handleMergeConfirm(bc)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-accent-green/10 border border-accent-green/20 text-accent-green hover:bg-accent-green/20 transition-colors"
                      >
                        Shu barkodga qo'shish
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleMergeNew}
                  className="flex-1 py-2.5 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm font-medium hover:bg-accent-blue/20 transition-colors"
                >
                  Yangi barkod yaratish
                </button>
                <button
                  onClick={() => { setMergeDialog(null); pendingGenerate.current = null }}
                  className="px-4 py-2.5 rounded-xl bg-bg-tertiary border border-border text-text-secondary text-sm hover:text-text-primary transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barkod detail modal */}
      <AnimatePresence>
        {detailModal && (() => {
          const { bItems, withBarcode, withoutBarcode, uniqueBarcodes, isGroup, isPerItem, isSingle } = getBatchBarcodeState(detailModal.id)
          const hasGroupBc = isGroup || isSingle
          const batchDate = detailModal.receivedAt
            ? new Date(detailModal.receivedAt).toLocaleDateString('uz-UZ') : '—'
          // Group barkodda birinchi itemning statistikasi umumiy (barchasi bir xil)
          const groupItem = withBarcode[0]

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4"
              onClick={() => setDetailModal(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-bg-secondary border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
              >
                {/* Modal header */}
                <div className="flex items-start justify-between p-5 border-b border-border">
                  <div>
                    <h3 className="font-syne font-bold text-text-primary">{selectedProduct?.name}</h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      Kirim: {batchDate}
                      {detailModal.supplierName && ` · ${detailModal.supplierName}`}
                    </p>
                    {detailModal.attributes && Object.keys(detailModal.attributes).length > 0 && (
                      <div className="mt-1.5">
                        <AttrBadges attributes={detailModal.attributes} />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setDetailModal(null)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Modal body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">

                  {/* Barkod yo'q */}
                  {withBarcode.length === 0 && (
                    <div className="text-center py-8">
                      <Tag size={32} className="text-text-muted mx-auto mb-2" />
                      <p className="text-sm text-text-muted">Bu kirim uchun hali barkod yaratilmagan</p>
                      <p className="text-xs text-text-muted mt-1">{withoutBarcode.length} ta tovar barkod kutmoqda</p>
                    </div>
                  )}

                  {/* Group barkod */}
                  {hasGroupBc && groupItem && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Umumiy barkod</span>
                        <Badge cls="text-accent-blue bg-accent-blue/10">{withBarcode.length} ta uchun</Badge>
                      </div>

                      {/* SVG */}
                      <div className="bg-bg-tertiary rounded-xl p-4 flex items-center gap-6">
                        <svg id="modal-group-bc" className="text-text-primary flex-shrink-0" style={{width: 200}} />
                        <div className="space-y-2">
                          <p className={`font-mono text-base font-bold text-accent-green ${barcodeSelectClass}`}>
                            {uniqueBarcodes[0]}
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-bg-secondary rounded-lg p-2.5 text-center">
                              <p className="text-lg font-bold text-text-primary">{groupItem.printCount || 0}</p>
                              <p className="text-[10px] text-text-muted">marta chop etildi</p>
                            </div>
                            <div className="bg-bg-secondary rounded-lg p-2.5 text-center">
                              <p className="text-lg font-bold text-text-primary">{groupItem.downloadCount || 0}</p>
                              <p className="text-[10px] text-text-muted">marta yuklab olindi</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {(() => { const { label, cls } = getItemStatus(groupItem, t); return <Badge cls={cls}>{label}</Badge> })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Per-item barkodlar jadvali */}
                  {isPerItem && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Har biriga alohida barkodlar</span>
                        <Badge cls="text-accent-blue bg-accent-blue/10">{withBarcode.length} ta</Badge>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-border">
                        <table className="w-full text-sm">
                          <thead className="bg-bg-tertiary">
                            <tr>
                              <th className="px-3 py-2.5 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">Barkod</th>
                              <th className="px-3 py-2.5 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">Chop</th>
                              <th className="px-3 py-2.5 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">Yuklab</th>
                              <th className="px-3 py-2.5 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">Holat</th>
                              <th className="px-3 py-2.5 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {withBarcode.map(item => {
                              const { label, cls } = getItemStatus(item, t)
                              return (
                                <tr key={item.id} className="hover:bg-bg-tertiary/30 transition-colors">
                                  <td className={`px-3 py-2 font-mono text-xs text-text-primary ${barcodeSelectClass}`}>
                                    {item.barcode}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className={`text-sm font-bold ${item.printCount > 0 ? 'text-accent-green' : 'text-text-muted'}`}>
                                      {item.printCount || 0}×
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className={`text-sm font-bold ${item.downloadCount > 0 ? 'text-accent-blue' : 'text-text-muted'}`}>
                                      {item.downloadCount || 0}×
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>{label}</span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <button
                                      onClick={() => handleDownloadBarcode(item.barcode)}
                                      className="p-1 rounded text-text-muted hover:text-accent-blue transition-colors"
                                      title="Yuklab olish"
                                    >
                                      <Download size={12} />
                                    </button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Barkod yaratilmagan tovarlar haqida xabar */}
                  {withoutBarcode.length > 0 && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-accent-orange/5 border border-accent-orange/20">
                      <AlertCircle size={14} className="text-accent-orange flex-shrink-0" />
                      <p className="text-xs text-accent-orange">
                        {withoutBarcode.length} ta tovar hali barkod olishini kutmoqda
                      </p>
                    </div>
                  )}
                </div>

                {/* Modal footer */}
                <div className="p-4 border-t border-border flex items-center justify-between gap-3">
                  <p className="text-xs text-text-muted">
                    Jami: {bItems.length} ta · Barkodli: {withBarcode.length} ta
                  </p>
                  <div className="flex gap-2">
                    {hasGroupBc && (
                      <>
                        <button
                          onClick={() => { setDetailModal(null); handlePrintGroup(detailModal) }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-green/10 border border-accent-green/20 text-accent-green text-sm font-medium hover:bg-accent-green/20 transition-colors"
                        >
                          <Printer size={14} /> Chop etish
                        </button>
                        <button
                          onClick={() => handleDownloadBarcode(uniqueBarcodes[0])}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm font-medium hover:bg-accent-blue/20 transition-colors"
                        >
                          <Download size={14} /> Yuklab olish
                        </button>
                      </>
                    )}
                    {isPerItem && (
                      <button
                        onClick={() => { setDetailModal(null); handlePrintPerItem(detailModal) }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-green/10 border border-accent-green/20 text-accent-green text-sm font-medium hover:bg-accent-green/20 transition-colors"
                      >
                        <Printer size={14} /> Barcha barkodlarni chop etish ({withBarcode.length})
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Chap: mahsulot ro'yxati */}
        <div className="lg:col-span-2 bg-bg-secondary border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-syne font-bold text-text-primary">{t('wh_bc_select_product')}</h3>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              placeholder={t('wh_bc_search_ph')}
              className="w-full pl-9 pr-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue transition-colors"
            />
          </div>
          <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
            {filteredProducts.map(p => {
              const pItems = items.filter(i => i.productId === p.id && i.status === 'in_stock')
              const noBarcodeCount = pItems.filter(i => !i.barcode).length
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${selectedProduct?.id === p.id ? 'border-accent-red bg-accent-red/5' : 'border-border hover:border-accent-blue hover:bg-bg-tertiary'}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-text-primary text-sm">{p.name}</p>
                    {noBarcodeCount > 0 && <Badge cls="text-accent-orange bg-accent-orange/10">{noBarcodeCount} {t('wh_new_product')}</Badge>}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{t('cat_' + p.category, { defaultValue: p.categoryLabel })} · {p.size} · {pItems.length} {pItems[0]?.unit || 'dona'}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* O'ng: batch kartalar */}
        <div className="lg:col-span-3 bg-bg-secondary border border-border rounded-2xl p-5 flex flex-col gap-4">
          {!selectedProduct ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 gap-3">
              <Tag size={40} className="text-text-muted" />
              <p className="text-text-secondary text-sm">{t('wh_bc_select_hint')}</p>
            </div>
          ) : (
            <>
              <div>
                <h3 className="font-syne font-bold text-text-primary text-sm">{selectedProduct.name}</h3>
                <p className="text-xs text-text-muted mt-0.5">Kirim partiyalari bo'yicha barkodlash</p>
              </div>

              {productBatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Tag size={32} className="text-text-muted" />
                  <p className="text-xs text-text-muted">Bu mahsulot uchun kirim topilmadi</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {productBatches.map(batch => {
                    const { bItems, withBarcode, withoutBarcode, uniqueBarcodes, isGroup, isPerItem, isSingle } = getBatchBarcodeState(batch.id)
                    const isGenerating = generatingBatch === batch.id
                    const hasAttrs = batch.attributes && Object.keys(batch.attributes).length > 0
                    const batchDate = batch.receivedAt
                      ? new Date(batch.receivedAt).toLocaleDateString('uz-UZ') : '—'
                    const hasBarcodes = withBarcode.length > 0

                    return (
                      <div key={batch.id} className="border border-border rounded-xl overflow-hidden">
                        {/* Batch header — bosilganda modal ochiladi */}
                        <button
                          onClick={() => hasBarcodes && setDetailModal(batch)}
                          className={`w-full text-left px-4 pt-4 pb-3 ${hasBarcodes ? 'hover:bg-bg-tertiary/40 cursor-pointer' : 'cursor-default'} transition-colors`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-semibold text-text-primary">Kirim: {batchDate}</p>
                                {hasBarcodes && (
                                  <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
                                    <Eye size={10} /> Batafsil
                                  </span>
                                )}
                              </div>
                              {batch.supplierName && (
                                <p className="text-[11px] text-text-muted">{batch.supplierName}</p>
                              )}
                              {hasAttrs && <AttrBadges attributes={batch.attributes} />}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold text-text-primary">{bItems.length}</p>
                              <p className="text-[10px] text-text-muted">{batch.unit || 'dona'}</p>
                            </div>
                          </div>
                        </button>

                        <div className="px-4 pb-4 space-y-3">
                          {/* Group barkod ko'rsatish */}
                          {(isGroup || isSingle) && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-mono text-xs text-accent-green ${barcodeSelectClass}`}>
                                {uniqueBarcodes[0]}
                              </span>
                              <Badge cls="text-accent-blue bg-accent-blue/10">
                                {isGroup ? 'Umumiy' : 'Yagona'} barkod
                              </Badge>
                              <span className="text-[10px] text-text-muted">{withBarcode.length} ta</span>
                            </div>
                          )}

                          {/* Per-item barkod ko'rsatish */}
                          {isPerItem && (
                            <div className="flex items-center gap-2">
                              <Badge cls="text-text-secondary bg-bg-tertiary">Alohida barkodlar</Badge>
                              <span className="text-[10px] text-text-muted">{withBarcode.length} ta</span>
                            </div>
                          )}

                          {/* Barkod yaratish tugmalari */}
                          {withoutBarcode.length > 0 && (
                            <div className="space-y-2">
                              {hasBarcodes && (
                                <p className="text-[11px] text-text-muted">
                                  {withoutBarcode.length} ta tovarga hali barkod berilmagan
                                </p>
                              )}
                              <div className="flex gap-2 flex-wrap">
                                <button
                                  onClick={() => handleGenerateGroup(batch)}
                                  disabled={isGenerating}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-red text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                  {isGenerating
                                    ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    : <Layers size={13} />
                                  }
                                  Umumiy barkod ({withoutBarcode.length} ta)
                                </button>
                                <button
                                  onClick={() => handleGeneratePerItem(batch)}
                                  disabled={isGenerating}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bg-tertiary border border-border text-text-secondary text-xs font-medium hover:text-text-primary hover:border-accent-blue transition-all disabled:opacity-50"
                                >
                                  {isGenerating
                                    ? <div className="w-3 h-3 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
                                    : <Hash size={13} />
                                  }
                                  Har biriga alohida
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Chop etish tugmasi */}
                          {hasBarcodes && (
                            <button
                              onClick={() => isGroup || isSingle ? handlePrintGroup(batch) : handlePrintPerItem(batch)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-green/10 border border-accent-green/20 text-accent-green text-xs font-medium hover:bg-accent-green/20 transition-colors w-full justify-center"
                            >
                              <Printer size={12} />
                              Barcha barkodlarni chop etish ({withBarcode.length} ta)
                            </button>
                          )}

                          {bItems.length === 0 && (
                            <p className="text-[11px] text-text-muted italic">Omborda tovar qolmagan</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Barcha barkodlar jadvali */}
        <div className="lg:col-span-5 bg-bg-secondary border border-border rounded-2xl p-6 flex flex-col mt-6" style={{minHeight: '520px'}}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-syne font-bold text-text-primary">{t('wh_bc_all_title')}</h3>
              <p className="text-xs text-text-muted">{t('wh_bc_all_subtitle')}</p>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={allBarcodesSearch}
                onChange={e => { setAllBarcodesSearch(e.target.value); setAllBarcodesPage(1) }}
                placeholder={t('wh_bc_search_ph2')}
                className="pl-8 pr-4 py-2 bg-bg-tertiary border border-border rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue transition-colors w-64"
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse" style={{tableLayout: 'auto'}}>
              <thead className="bg-bg-tertiary">
                <tr>
                  <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap" style={{minWidth: '110px'}} onClick={() => handleSort1('batchDate')}>
                    <span className="inline-flex items-center gap-1">{t('wh_bc_income_date')} <SortIcon field="batchDate" sortField={sort1Field} sortDir={sort1Dir} /></span>
                  </th>
                  <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap" onClick={() => handleSort1('productName')}>
                    <span className="inline-flex items-center gap-1">{t('col_product')} <SortIcon field="productName" sortField={sort1Field} sortDir={sort1Dir} /></span>
                  </th>
                  <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap" style={{minWidth: '110px'}} onClick={() => handleSort1('barcodeDate')}>
                    <span className="inline-flex items-center gap-1">{t('wh_bc_bc_date')} <SortIcon field="barcodeDate" sortField={sort1Field} sortDir={sort1Dir} /></span>
                  </th>
                  <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider" style={{minWidth: '200px'}}>{t('wh_modal_barcode')}</th>
                  <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider whitespace-nowrap">Rejim</th>
                  <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider whitespace-nowrap">Chop/Yuk</th>
                  <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap" style={{minWidth: '110px'}} onClick={() => handleSort1('status')}>
                    <span className="inline-flex items-center gap-1">{t('col_status')} <SortIcon field="status" sortField={sort1Field} sortDir={sort1Dir} /></span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allBarcodesPagedItems.map(item => {
                  const { label, cls, trCls } = getItemStatus(item, t)
                  const batchDate = item.batchDate ? new Date(item.batchDate).toLocaleDateString('uz-UZ') : '—'
                  const barcodeDate = item.barcodeCreatedAt ? new Date(item.barcodeCreatedAt).toLocaleDateString('uz-UZ') : '—'
                  const countLabel = [
                    item.printCount > 0 ? `chop ${item.printCount}x` : '',
                    item.downloadCount > 0 ? `yuk ${item.downloadCount}x` : '',
                  ].filter(Boolean).join(', ') || '—'
                  const isGroupBc = item.barcode && item.barcode.includes('-G')
                  return (
                    <tr key={item.id} className={`hover:bg-bg-tertiary/20 transition-colors ${trCls}`}>
                      <td className="px-4 py-3 text-xs text-text-muted">{batchDate}</td>
                      <td className="px-4 py-3 font-semibold text-text-primary truncate">{item.productName}</td>
                      <td className="px-4 py-3 text-xs text-text-muted">{barcodeDate}</td>
                      <td className={`px-4 py-3 font-mono text-xs text-text-primary ${barcodeSelectClass}`}>{item.barcode || '—'}</td>
                      <td className="px-4 py-3">
                        {item.barcode && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isGroupBc ? 'bg-accent-blue/10 text-accent-blue' : 'bg-bg-tertiary text-text-muted'}`}>
                            {isGroupBc ? 'Umumiy' : 'Alohida'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">{countLabel}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>{label}</span>
                      </td>
                    </tr>
                  )
                })}
                {allBarcodesPagedItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-xs text-text-muted">{t('wh_bc_not_found')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-text-muted">
              {Math.min(allBarcodesPage * ALL_BARCODES_PER_PAGE, allBarcodeItems.length)} / {allBarcodeItems.length} ta
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setAllBarcodesPage(p => Math.max(1, p - 1))} disabled={allBarcodesPage === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors">←</button>
              {Array.from({ length: Math.min(allBarcodesTotalPages, 5) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setAllBarcodesPage(n)} className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${allBarcodesPage === n ? 'bg-accent-red text-white' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'}`}>{n}</button>
              ))}
              <button onClick={() => setAllBarcodesPage(p => Math.min(allBarcodesTotalPages, p + 1))} disabled={allBarcodesPage === allBarcodesTotalPages || allBarcodesTotalPages === 0} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors">→</button>
            </div>
          </div>
        </div>

        {/* Sotilgan tovarlar jadvali */}
        <div className="lg:col-span-5 bg-bg-secondary border border-border rounded-2xl p-6 flex flex-col mt-6" style={{minHeight: '420px'}}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-syne font-bold text-text-primary">{t('wh_bc_sold_title')}</h3>
              <p className="text-xs text-text-muted">{t('wh_bc_sold_subtitle')}</p>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={soldBarcodesSearch}
                onChange={e => { setSoldBarcodesSearch(e.target.value); setSoldBarcodesPage(1) }}
                placeholder={t('wh_bc_search_ph2')}
                className="pl-8 pr-4 py-2 bg-bg-tertiary border border-border rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue transition-colors w-64"
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse" style={{tableLayout: 'auto'}}>
              <thead className="bg-bg-tertiary">
                <tr>
                  <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap" style={{minWidth: '110px'}} onClick={() => handleSort2('batchDate')}>
                    <span className="inline-flex items-center gap-1">{t('wh_bc_income_date')} <SortIcon field="batchDate" sortField={sort2Field} sortDir={sort2Dir} /></span>
                  </th>
                  <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap" onClick={() => handleSort2('productName')}>
                    <span className="inline-flex items-center gap-1">{t('col_product')} <SortIcon field="productName" sortField={sort2Field} sortDir={sort2Dir} /></span>
                  </th>
                  <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap" style={{minWidth: '110px'}} onClick={() => handleSort2('barcodeDate')}>
                    <span className="inline-flex items-center gap-1">{t('wh_bc_bc_date')} <SortIcon field="barcodeDate" sortField={sort2Field} sortDir={sort2Dir} /></span>
                  </th>
                  <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider" style={{minWidth: '200px'}}>{t('wh_modal_barcode')}</th>
                  <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider" style={{minWidth: '110px'}}>{t('wh_bc_sold_date')}</th>
                  <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap" style={{minWidth: '100px'}} onClick={() => handleSort2('status')}>
                    <span className="inline-flex items-center gap-1">{t('col_status')} <SortIcon field="status" sortField={sort2Field} sortDir={sort2Dir} /></span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {soldPagedItems.map(item => {
                  const batchDate = item.batchDate ? new Date(item.batchDate).toLocaleDateString('uz-UZ') : '—'
                  const barcodeDate = item.barcodeCreatedAt ? new Date(item.barcodeCreatedAt).toLocaleDateString('uz-UZ') : '—'
                  const soldDate = item.soldAt
                    ? new Date(item.soldAt).toLocaleDateString('uz-UZ')
                    : (item.barcodeCreatedAt ? new Date(item.barcodeCreatedAt).toLocaleDateString('uz-UZ') : '—')
                  return (
                    <tr key={item.id} className="hover:bg-bg-tertiary/20 transition-colors">
                      <td className="px-4 py-3 text-xs text-text-muted">{batchDate}</td>
                      <td className="px-4 py-3 font-semibold text-text-primary truncate">{item.productName}</td>
                      <td className="px-4 py-3 text-xs text-text-muted">{barcodeDate}</td>
                      <td className={`px-4 py-3 font-mono text-xs text-text-primary ${barcodeSelectClass}`}>{item.barcode}</td>
                      <td className="px-4 py-3 text-xs text-text-muted">{soldDate}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-bg-tertiary text-text-muted">{t('sold')}</span>
                      </td>
                    </tr>
                  )
                })}
                {soldPagedItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-xs text-text-muted">{t('wh_bc_sold_not_found')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-text-muted">
              {Math.min(soldBarcodesPage * SOLD_PER_PAGE, soldBarcodeItems.length)} / {soldBarcodeItems.length} ta
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setSoldBarcodesPage(p => Math.max(1, p - 1))} disabled={soldBarcodesPage === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors">←</button>
              {Array.from({ length: Math.min(soldTotalPages, 5) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setSoldBarcodesPage(n)} className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${soldBarcodesPage === n ? 'bg-accent-red text-white' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'}`}>{n}</button>
              ))}
              <button onClick={() => setSoldBarcodesPage(p => Math.min(soldTotalPages, p + 1))} disabled={soldBarcodesPage === soldTotalPages || soldTotalPages === 0} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors">→</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default BarcodeTab
