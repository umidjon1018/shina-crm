import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Tag, Printer, Eye, Layers, Hash, X, AlertCircle, Download, Plus, Pencil, Trash2 } from 'lucide-react'
import { generateBarcodes, updateBarcodeStatus, findExistingGroupBarcode } from '../../../api/itemService'
import { updateBatchAttributes } from '../../../api/incomeService'
import { useSettingsStore } from '../../../store/settingsStore'
import { getItemStatus } from '../../../utils/itemStatus'
import JsBarcode from 'jsbarcode'
import { Badge } from '../whHelpers.jsx'

const AttrBadges = ({ attributes }) => {
  if (!attributes || Object.keys(attributes).length === 0) return null
  return (
    <div className="flex flex-wrap gap-1">
      {Object.entries(attributes).map(([k, v]) => (
        <span key={k} className="px-1.5 py-0.5 rounded-md bg-bg-tertiary border border-border text-[10px] text-text-secondary">
          {k}: <span className={v ? 'text-text-primary font-medium' : 'text-text-muted italic'}>{v || 'xususiyatsiz'}</span>
        </span>
      ))}
    </div>
  )
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

const downloadPng = (barcodeValue) => {
  return new Promise(resolve => {
    try {
      const canvas = document.createElement('canvas')
      JsBarcode(canvas, barcodeValue, {
        format: 'CODE128', width: 2, height: 60,
        displayValue: true, fontSize: 12, margin: 10,
        background: '#ffffff', lineColor: '#000000',
      })
      canvas.toBlob(blob => {
        if (!blob) { resolve(); return }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${barcodeValue}.png`
        a.click()
        URL.revokeObjectURL(url)
        resolve()
      })
    } catch { resolve() }
  })
}

const BarcodeTab = ({ products, batches = [], items, userRole, userId, userName, downloadEnabled, notificationSettings, addNotification, onRefresh }) => {
  const { t } = useTranslation()
  const barcodeSelectClass = userRole === 'admin' ? '' : 'select-none'
  const { productAttributeDefs } = useSettingsStore()

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productSearch, setProductSearch] = useState('')
  const [generatingBatch, setGeneratingBatch] = useState(null)
  const [mergeDialog, setMergeDialog] = useState(null)
  const [detailModal, setDetailModal] = useState(null)
  const [attrEditModal, setAttrEditModal] = useState(null)
  const [deleteGroupModal, setDeleteGroupModal] = useState(null)
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
    if (sortField !== field) return <span className="text-text-muted ml-1 text-[10px]">⇅</span>
    return <span className="text-accent-blue ml-1 text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
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

  // Batch kartalarni 3 bo'limga ajratamiz:
  // 1. groupCards  — bir xil umumiy barkod (bir nechta batch birlashadi)
  // 2. perItemBatches — har biriga alohida barkodlar
  // 3. noBarcodeBatches — barkod yo'q (generate tugmalari ko'rsatiladi)
  const { groupCards, perItemBatches, noBarcodeBatches } = useMemo(() => {
    const groupMap = new Map()
    const perItemBatches = []
    const noBarcodeBatches = []

    productBatches.forEach(batch => {
      const { withBarcode, withoutBarcode, uniqueBarcodes, isGroup, isPerItem, isSingle } = getBatchBarcodeState(batch.id)

      if (withBarcode.length === 0) {
        noBarcodeBatches.push(batch)
      } else if (isGroup || isSingle) {
        const bc = uniqueBarcodes[0]
        if (!groupMap.has(bc)) {
          groupMap.set(bc, { barcode: bc, attributes: batch.attributes || {}, batches: [] })
        }
        groupMap.get(bc).batches.push({
          ...batch,
          barcodeCount: withBarcode.length,
          noBarcodeCount: withoutBarcode.length,
        })
      } else if (isPerItem) {
        perItemBatches.push(batch)
      }
    })

    return { groupCards: [...groupMap.values()], perItemBatches, noBarcodeBatches }
  }, [productBatches, items])

  // Modal SVG render
  useEffect(() => {
    if (!detailModal) return
    let barcodeValue = null
    if (detailModal.type === 'group') {
      barcodeValue = detailModal.barcode
    } else if (detailModal.type === 'peritem') {
      const { uniqueBarcodes, isGroup, isSingle } = getBatchBarcodeState(detailModal.batch.id)
      if (isGroup || isSingle) barcodeValue = uniqueBarcodes[0]
    }
    if (barcodeValue) {
      setTimeout(() => {
        try {
          JsBarcode('#modal-group-bc', barcodeValue, {
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

  // Per-item → umumiy (bitta batch uchun)
  const handleConvertToGroup = async (batch) => {
    const { bItems } = getBatchBarcodeState(batch.id)
    const allItemIds = bItems.map(i => i.id)
    if (!allItemIds.length) return
    setGeneratingBatch(batch.id)
    try {
      await generateBarcodes(allItemIds, userId, { mode: 'group', force: true })
      onRefresh?.()
    } finally {
      setGeneratingBatch(null)
    }
  }

  // Umumiy → alohida (butun group card uchun — barcha batchlar)
  const handleConvertGroupToPerItem = async (group) => {
    const allGroupItems = items.filter(i => i.barcode === group.barcode && i.status === 'in_stock')
    if (!allGroupItems.length) return
    setGeneratingBatch(group.barcode)
    try {
      await generateBarcodes(allGroupItems.map(i => i.id), userId, { mode: 'per_item', force: true })
      onRefresh?.()
    } finally {
      setGeneratingBatch(null)
    }
  }

  // Guruhda barkod yo'q elementlarni mavjud barkodga qo'shish
  const handleAddToGroup = async (group) => {
    const batchIds = new Set(group.batches.map(b => b.id))
    const unbarcoded = items.filter(i => batchIds.has(i.batchId) && !i.barcode && i.status === 'in_stock')
    if (!unbarcoded.length) return
    setGeneratingBatch(group.barcode)
    try {
      await generateBarcodes(unbarcoded.map(i => i.id), userId, { mode: 'group', baseBarcode: group.barcode })
      onRefresh?.()
    } finally {
      setGeneratingBatch(null)
    }
  }

  // Umumiy barkoddan itemlarni boshqa guruhga ko'chirish, so'ng original card yo'qoladi
  const handleMoveGroupItemsTo = async (targetBarcode) => {
    if (!deleteGroupModal) return
    const { group } = deleteGroupModal
    const inStockItems = items.filter(i => i.barcode === group.barcode && i.status === 'in_stock')
    if (!inStockItems.length) { setDeleteGroupModal(null); return }
    setGeneratingBatch(group.barcode)
    try {
      await generateBarcodes(inStockItems.map(i => i.id), userId, { mode: 'group', baseBarcode: targetBarcode, force: true })
      setDeleteGroupModal(null)
      onRefresh?.()
    } finally {
      setGeneratingBatch(null)
    }
  }

  // Umumiy barkoddan itemlarni alohida barkodga o'tkazish, card yo'qoladi
  const handleConvertGroupAndDelete = async () => {
    if (!deleteGroupModal) return
    const { group } = deleteGroupModal
    setDeleteGroupModal(null)
    await handleConvertGroupToPerItem(group)
  }

  // Batch xususiyatini yangilash
  const handleSaveAttrs = async () => {
    if (!attrEditModal) return
    for (const bid of attrEditModal.batchIds) {
      await updateBatchAttributes(bid, attrEditModal.attrs)
    }
    setAttrEditModal(null)
    onRefresh?.()
  }

  // === Print handlers ===

  const handlePrintGroupBarcodeByValue = async (barcodeValue, allItems) => {
    const svgHtml = await createBarcodeSvgHtml(barcodeValue)
    if (!svgHtml) return
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html><body style="margin:16px;background:#0F1520;">
        <div style="margin-bottom:8px;font-family:monospace;color:#aaa;font-size:12px;">
          ${selectedProduct?.name || ''} — Umumiy barkod · ${allItems.length} ta uchun
        </div>
        <div style="background:#0F1520;display:inline-block;padding:4px;">${svgHtml}</div>
      </body></html>
    `)
    printWindow.document.close()
    printWindow.print()
    printWindow.close()
    // Umumiy barkod: faqat count++ — reprint cheklanmaydi (bir barkod ko'p item uchun)
    await updateBarcodeStatus(allItems.map(i => i.id), { status: 'printed' })
    onRefresh?.()
  }

  const handlePrintSingleItem = async (item) => {
    const svgHtml = await createBarcodeSvgHtml(item.barcode)
    if (!svgHtml) return
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html><body style="margin:16px;background:#0F1520;">
        <div style="background:#0F1520;display:inline-block;padding:4px;">${svgHtml}</div>
      </body></html>
    `)
    printWindow.document.close()
    printWindow.print()
    printWindow.close()
    await updateBarcodeStatus([item.id], { status: 'printed', reprintAllowed: false })
    onRefresh?.()
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

  // === Download handlers ===

  const handleDownloadGroupBarcodeByValue = async (barcodeValue, allItems) => {
    await downloadPng(barcodeValue)
    // Umumiy barkod: faqat count++ — reprint cheklanmaydi
    await updateBarcodeStatus(allItems.map(i => i.id), { status: 'downloaded' })
    onRefresh?.()
  }

  const handleDownloadSingleItem = async (item) => {
    await downloadPng(item.barcode)
    await updateBarcodeStatus([item.id], { status: 'downloaded', reprintAllowed: false })
    onRefresh?.()
  }

  const handleDownloadAllPerItem = async (batch) => {
    const { withBarcode } = getBatchBarcodeState(batch.id)
    if (!withBarcode.length) return
    for (const item of withBarcode) {
      await downloadPng(item.barcode)
      await new Promise(r => setTimeout(r, 200))
    }
    await updateBarcodeStatus(withBarcode.map(i => i.id), { status: 'downloaded', reprintAllowed: false })
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
      {/* Delete Group Modal */}
      <AnimatePresence>
        {deleteGroupModal && (() => {
          const { group } = deleteGroupModal
          const inStockItems = items.filter(i => i.barcode === group.barcode && i.status === 'in_stock')
          const otherGroups = groupCards.filter(g => g.barcode !== group.barcode)
          const isGenerating = generatingBatch === group.barcode
          return (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={() => !isGenerating && setDeleteGroupModal(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl"
              >
                <div className="flex items-start gap-3 mb-4">
                  <Trash2 size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-syne font-bold text-text-primary">Umumiy barkodni o'chirish</h3>
                    <p className="font-mono text-sm text-accent-green mt-0.5">{group.barcode}</p>
                  </div>
                </div>

                {inStockItems.length > 0 ? (
                  <>
                    <div className="p-3 rounded-xl bg-accent-orange/5 border border-accent-orange/20 mb-4">
                      <p className="text-sm text-text-secondary">
                        Bu barkodda hali <span className="font-bold text-accent-orange">{inStockItems.length} ta</span> tovar bor. O'chirish uchun ularni boshqa barkodga o'tkazing:
                      </p>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={handleConvertGroupAndDelete}
                        disabled={isGenerating}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-tertiary border border-border text-left hover:border-accent-blue hover:bg-accent-blue/5 transition-all disabled:opacity-50"
                      >
                        <Hash size={14} className="text-text-muted flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm text-text-primary">Har biriga alohida barkod yaratish</p>
                          <p className="text-xs text-text-muted">{inStockItems.length} ta tovar yangi barkod oladi</p>
                        </div>
                      </button>

                      {otherGroups.length > 0 && (
                        <div>
                          <p className="text-[11px] text-text-muted mb-1.5 px-1">Boshqa guruhga biriktirish:</p>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {otherGroups.map(og => (
                              <button
                                key={og.barcode}
                                onClick={() => handleMoveGroupItemsTo(og.barcode)}
                                disabled={isGenerating}
                                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-accent-green/5 border border-accent-green/20 hover:bg-accent-green/10 transition-all disabled:opacity-50"
                              >
                                <span className="font-mono text-xs font-bold text-accent-green">{og.barcode}</span>
                                {Object.keys(og.attributes).length > 0 && <AttrBadges attributes={og.attributes} />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-text-secondary mb-4">Bu barkod bo'sh — barcha tovarlar sotilgan. Barkod tarixi saqlanib qoladi.</p>
                )}

                <div className="flex gap-2 mt-4">
                  {isGenerating && (
                    <div className="flex items-center gap-2 text-text-muted text-xs">
                      <div className="w-4 h-4 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
                      Jarayonda...
                    </div>
                  )}
                  <button
                    onClick={() => setDeleteGroupModal(null)}
                    disabled={isGenerating}
                    className="ml-auto px-4 py-2 rounded-xl bg-bg-tertiary border border-border text-text-secondary text-sm hover:text-text-primary transition-colors disabled:opacity-50"
                  >
                    Bekor
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* Merge Dialog */}
      <AnimatePresence>
        {mergeDialog && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => { setMergeDialog(null); pendingGenerate.current = null }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle size={20} className="text-accent-orange flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-syne font-bold text-text-primary">Barkod allaqachon mavjud</h3>
                  <p className="text-sm text-text-secondary mt-1">Bu mahsulot va xususiyatlar uchun umumiy barkod oldindan yaratilgan.</p>
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
                <button onClick={handleMergeNew} className="flex-1 py-2.5 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-sm font-medium hover:bg-accent-blue/20 transition-colors">
                  Yangi barkod yaratish
                </button>
                <button onClick={() => { setMergeDialog(null); pendingGenerate.current = null }} className="px-4 py-2.5 rounded-xl bg-bg-tertiary border border-border text-text-secondary text-sm hover:text-text-primary transition-colors">
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attr Edit Modal */}
      <AnimatePresence>
        {attrEditModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setAttrEditModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-syne font-bold text-text-primary">Xususiyatlarni o'zgartirish</h3>
                <button onClick={() => setAttrEditModal(null)} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors">
                  <X size={16} />
                </button>
              </div>
              {(productAttributeDefs || []).length === 0 ? (
                <p className="text-sm text-text-muted">Xususiyat shablonlari sozlanmagan. Admin panelida qo'shing.</p>
              ) : (
                <div className="space-y-3">
                  {productAttributeDefs.map(def => {
                    const checked = def.label in attrEditModal.attrs
                    return (
                      <div key={def.id} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            if (e.target.checked) {
                              setAttrEditModal(m => ({ ...m, attrs: { ...m.attrs, [def.label]: def.values[0] || '' } }))
                            } else {
                              setAttrEditModal(m => {
                                const a = { ...m.attrs }
                                delete a[def.label]
                                return { ...m, attrs: a }
                              })
                            }
                          }}
                          className="w-4 h-4 accent-accent-red cursor-pointer"
                        />
                        <label className="text-sm text-text-secondary font-medium cursor-pointer min-w-[70px]">{def.label}</label>
                        {checked && (
                          <select
                            value={attrEditModal.attrs[def.label] === null ? '__none__' : (attrEditModal.attrs[def.label] || '')}
                            onChange={e => {
                              const val = e.target.value === '__none__' ? null : e.target.value
                              setAttrEditModal(m => ({ ...m, attrs: { ...m.attrs, [def.label]: val } }))
                            }}
                            className="flex-1 px-3 py-1.5 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-blue"
                          >
                            {def.values.map(v => <option key={v} value={v}>{v}</option>)}
                            <option value="__none__">Xususiyatsiz</option>
                          </select>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="flex gap-2 mt-5">
                <button
                  onClick={handleSaveAttrs}
                  className="flex-1 py-2.5 rounded-xl bg-accent-red text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Saqlash
                </button>
                <button
                  onClick={() => setAttrEditModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-bg-tertiary border border-border text-text-secondary text-sm hover:text-text-primary transition-colors"
                >
                  Bekor
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4"
            onClick={() => setDetailModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-bg-secondary border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
            >
              {detailModal.type === 'group' ? (() => {
                const allGroupItems = items.filter(i => i.barcode === detailModal.barcode && i.status === 'in_stock')
                // Umumiy barkodda barcha item count bir xil — birinchisi vakil
                const totalPrint = allGroupItems[0]?.printCount || 0
                const totalDownload = allGroupItems[0]?.downloadCount || 0
                return (
                  <>
                    <div className="flex items-start justify-between p-4 sm:p-5 border-b border-border">
                      <div>
                        <h3 className="font-syne font-bold text-text-primary">{selectedProduct?.name}</h3>
                        <p className="text-xs text-text-muted mt-0.5">Umumiy barkod · {allGroupItems.length} ta tovar</p>
                        {Object.keys(detailModal.attributes).length > 0 && (
                          <div className="mt-1.5"><AttrBadges attributes={detailModal.attributes} /></div>
                        )}
                      </div>
                      <button onClick={() => setDetailModal(null)} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors">
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                      {/* Barkod + statistika */}
                      <div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent-green/10 border border-accent-green/30 ${barcodeSelectClass}`}>
                          <span className="font-mono text-sm font-bold text-accent-green">{detailModal.barcode}</span>
                        </div>
                        <div className="bg-bg-tertiary rounded-xl p-4 flex items-center gap-3 sm:gap-6 mt-2">
                          <svg id="modal-group-bc" className="text-text-primary flex-shrink-0" style={{ width: 200 }} />
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-bg-secondary rounded-lg p-2.5 text-center">
                              <p className="text-lg font-bold text-text-primary">{totalPrint}</p>
                              <p className="text-[10px] text-text-muted">marta chop</p>
                            </div>
                            <div className="bg-bg-secondary rounded-lg p-2.5 text-center">
                              <p className="text-lg font-bold text-text-primary">{totalDownload}</p>
                              <p className="text-[10px] text-text-muted">marta yuklab</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Kirimlar bo'yicha */}
                      <div>
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Kirimlar bo'yicha</span>
                        <div className="mt-2 space-y-2">
                          {detailModal.batches.map((b, idx) => {
                            const bItems = items.filter(i => i.batchId === b.id && i.barcode === detailModal.barcode)
                            // Bir xil barkodli itemlar count bir xil — birinchisi vakil
                            const bPrint = bItems[0]?.printCount || 0
                            const bDownload = bItems[0]?.downloadCount || 0
                            const bDate = b.receivedAt ? new Date(b.receivedAt).toLocaleDateString('uz-UZ') : '—'
                            return (
                              <div key={b.id} className="bg-bg-tertiary rounded-xl p-3 flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-semibold text-text-primary">Kirim {idx + 1}</p>
                                  <p className="text-[10px] text-text-muted">{bDate}{b.supplierName ? ` · ${b.supplierName}` : ''}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-text-primary">{b.barcodeCount} ta</p>
                                  <p className="text-[10px] text-text-muted">Chop: {bPrint}× · Yuklab: {bDownload}×</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-t border-border flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-xs text-text-muted">Jami: {allGroupItems.length} ta</p>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => { setDetailModal(null); handlePrintGroupBarcodeByValue(detailModal.barcode, allGroupItems) }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-green/10 border border-accent-green/20 text-accent-green text-xs font-medium hover:bg-accent-green/20 transition-colors"
                        >
                          <Printer size={13} /> Chop etish
                        </button>
                        <button
                          onClick={() => { setDetailModal(null); handleDownloadGroupBarcodeByValue(detailModal.barcode, allGroupItems) }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs font-medium hover:bg-accent-blue/20 transition-colors"
                        >
                          <Download size={13} /> Yuklab olish
                        </button>
                      </div>
                    </div>
                  </>
                )
              })() : (() => {
                // type === 'peritem'
                const batch = detailModal.batch
                const { bItems, withBarcode, withoutBarcode, uniqueBarcodes, isGroup, isPerItem, isSingle } = getBatchBarcodeState(batch.id)
                const hasGroupBc = isGroup || isSingle
                const batchDate = batch.receivedAt ? new Date(batch.receivedAt).toLocaleDateString('uz-UZ') : '—'
                const groupItem = withBarcode[0]
                return (
                  <>
                    <div className="flex items-start justify-between p-4 sm:p-5 border-b border-border">
                      <div>
                        <h3 className="font-syne font-bold text-text-primary">{selectedProduct?.name}</h3>
                        <p className="text-xs text-text-muted mt-0.5">Kirim: {batchDate}{batch.supplierName ? ` · ${batch.supplierName}` : ''}</p>
                        {batch.attributes && Object.keys(batch.attributes).length > 0 && (
                          <div className="mt-1.5"><AttrBadges attributes={batch.attributes} /></div>
                        )}
                      </div>
                      <button onClick={() => setDetailModal(null)} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors">
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                      {withBarcode.length === 0 && (
                        <div className="text-center py-5 sm:py-8">
                          <Tag size={32} className="text-text-muted mx-auto mb-2" />
                          <p className="text-sm text-text-muted">Bu kirim uchun hali barkod yaratilmagan</p>
                        </div>
                      )}

                      {hasGroupBc && groupItem && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Umumiy barkod</span>
                            <Badge cls="text-accent-blue bg-accent-blue/10">{withBarcode.length} ta uchun</Badge>
                          </div>
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-accent-green/10 border border-accent-green/30 ${barcodeSelectClass}`}>
                            <span className="font-mono text-sm font-bold text-accent-green">{uniqueBarcodes[0]}</span>
                          </div>
                          <div className="bg-bg-tertiary rounded-xl p-4 flex items-center gap-3 sm:gap-6">
                            <svg id="modal-group-bc" className="text-text-primary flex-shrink-0" style={{ width: 200 }} />
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-bg-secondary rounded-lg p-2.5 text-center">
                                  <p className="text-lg font-bold text-text-primary">{groupItem.printCount || 0}</p>
                                  <p className="text-[10px] text-text-muted">marta chop</p>
                                </div>
                                <div className="bg-bg-secondary rounded-lg p-2.5 text-center">
                                  <p className="text-lg font-bold text-text-primary">{groupItem.downloadCount || 0}</p>
                                  <p className="text-[10px] text-text-muted">marta yuklab</p>
                                </div>
                              </div>
                              {(() => { const { label, cls } = getItemStatus(groupItem, t); return <Badge cls={cls}>{label}</Badge> })()}
                            </div>
                          </div>
                        </div>
                      )}

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
                                  <th className="px-3 py-2.5 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider">Chop</th>
                                  <th className="px-3 py-2.5 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider">Yuklab</th>
                                  <th className="px-3 py-2.5 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">Holat</th>
                                  <th className="px-3 py-2.5 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider w-16">Amal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {withBarcode.map(item => {
                                  const { label, cls } = getItemStatus(item, t)
                                  return (
                                    <tr key={item.id} className="hover:bg-bg-tertiary/30 transition-colors">
                                      <td className={`px-3 py-2 font-mono text-xs text-text-primary ${barcodeSelectClass}`}>{item.barcode}</td>
                                      <td className="px-3 py-2 text-center">
                                        <span className={`text-sm font-bold ${item.printCount > 0 ? 'text-accent-green' : 'text-text-muted'}`}>{item.printCount || 0}×</span>
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        <span className={`text-sm font-bold ${item.downloadCount > 0 ? 'text-accent-blue' : 'text-text-muted'}`}>{item.downloadCount || 0}×</span>
                                      </td>
                                      <td className="px-3 py-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>{label}</span>
                                      </td>
                                      <td className="px-3 py-2">
                                        <div className="flex items-center justify-center gap-1">
                                          <button onClick={() => handlePrintSingleItem(item)} className="p-1 rounded text-text-muted hover:text-accent-green transition-colors" title="Chop etish">
                                            <Printer size={12} />
                                          </button>
                                          <button onClick={() => handleDownloadSingleItem(item)} className="p-1 rounded text-text-muted hover:text-accent-blue transition-colors" title="Yuklab olish">
                                            <Download size={12} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {withoutBarcode.length > 0 && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-accent-orange/5 border border-accent-orange/20">
                          <AlertCircle size={14} className="text-accent-orange flex-shrink-0" />
                          <p className="text-xs text-accent-orange">{withoutBarcode.length} ta tovar hali barkod olishini kutmoqda</p>
                        </div>
                      )}
                    </div>

                    <div className="p-4 border-t border-border flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-xs text-text-muted">Jami: {bItems.length} ta · Barkodli: {withBarcode.length} ta</p>
                      <div className="flex gap-2 flex-wrap">
                        {hasGroupBc && (
                          <>
                            <button onClick={() => { setDetailModal(null); handlePrintGroupBarcodeByValue(uniqueBarcodes[0], withBarcode) }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-green/10 border border-accent-green/20 text-accent-green text-xs font-medium hover:bg-accent-green/20 transition-colors">
                              <Printer size={13} /> Chop etish
                            </button>
                            <button onClick={() => { setDetailModal(null); handleDownloadGroupBarcodeByValue(uniqueBarcodes[0], withBarcode) }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs font-medium hover:bg-accent-blue/20 transition-colors">
                              <Download size={13} /> Yuklab olish
                            </button>
                          </>
                        )}
                        {isPerItem && (
                          <>
                            <button onClick={() => { setDetailModal(null); handlePrintPerItem(batch) }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-green/10 border border-accent-green/20 text-accent-green text-xs font-medium hover:bg-accent-green/20 transition-colors">
                              <Printer size={13} /> Barcha chop etish ({withBarcode.length})
                            </button>
                            <button onClick={() => { setDetailModal(null); handleDownloadAllPerItem(batch) }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs font-medium hover:bg-accent-blue/20 transition-colors">
                              <Download size={13} /> Barcha yuklab olish ({withBarcode.length})
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-5 gap-3 sm:gap-6">
        {/* Chap: mahsulot ro'yxati */}
        <div className="lg:col-span-2 bg-bg-secondary border border-border rounded-2xl p-4 sm:p-5 space-y-4">
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
                    <p className="font-medium text-text-primary text-sm truncate pr-2">{p.name}</p>
                    {noBarcodeCount > 0 && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full bg-accent-orange/10 border border-accent-orange/20 text-accent-orange text-[10px] font-bold whitespace-nowrap">
                        {noBarcodeCount} ta barkod yo'q
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{t('cat_' + p.category, { defaultValue: p.categoryLabel })} · {p.size} · {pItems.length} {pItems[0]?.unit || 'dona'}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* O'ng: batch kartalar (3 bo'lim) */}
        <div className="lg:col-span-3 bg-bg-secondary border border-border rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
          {!selectedProduct ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 gap-3">
              <Tag size={40} className="text-text-muted" />
              <p className="text-text-secondary text-sm text-center">{t('wh_bc_select_hint')}</p>
              <p className="text-text-muted text-xs text-center">Chap panelda mahsulot tanlang<br />keyin shu yerda barkod yarating</p>
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
                <div className="space-y-4 max-h-[540px] overflow-y-auto pr-1">

                  {/* === Bo'lim 1: Umumiy barkodlar === */}
                  {groupCards.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">Umumiy barkodlar</p>
                      {groupCards.map(group => {
                        const allGroupItems = items.filter(i => i.barcode === group.barcode && i.status === 'in_stock')
                        const totalCount = allGroupItems.length
                        const isGenerating = generatingBatch === group.barcode
                        const hasUnbarcoded = group.batches.some(b => b.noBarcodeCount > 0)

                        return (
                          <div key={group.barcode} className="border border-accent-green/20 bg-accent-green/[0.03] rounded-xl overflow-hidden">
                            <div className="px-4 pt-3 pb-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  {/* Barkod badge + soni */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-green/10 border border-accent-green/25 ${barcodeSelectClass}`}>
                                      <span className="font-mono text-xs font-bold text-accent-green">{group.barcode}</span>
                                    </div>
                                    <Badge cls="text-accent-blue bg-accent-blue/10">{totalCount} ta uchun</Badge>
                                  </div>

                                  {/* Xususiyatlar */}
                                  {Object.keys(group.attributes).length > 0 && (
                                    <AttrBadges attributes={group.attributes} />
                                  )}

                                  {/* Kirimlar ro'yxati */}
                                  <div className="space-y-0.5">
                                    {group.batches.map((b, idx) => {
                                      const bDate = b.receivedAt ? new Date(b.receivedAt).toLocaleDateString('uz-UZ') : '—'
                                      return (
                                        <div key={b.id} className="flex items-center gap-1.5 text-[10px] text-text-muted">
                                          <span className="text-text-secondary font-medium">{bDate}</span>
                                          {b.supplierName && <span>· {b.supplierName}</span>}
                                          <span className="text-accent-blue font-bold">· {b.barcodeCount} ta</span>
                                          {b.noBarcodeCount > 0 && (
                                            <span className="text-accent-orange">({b.noBarcodeCount} ta barkod yo'q)</span>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Amallar */}
                            <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => setDetailModal({ type: 'group', barcode: group.barcode, attributes: group.attributes, batches: group.batches })}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-bg-tertiary border border-border text-text-muted text-xs hover:text-text-primary hover:border-accent-blue transition-all"
                              >
                                <Eye size={11} /> Batafsil
                              </button>
                              <button
                                onClick={() => handlePrintGroupBarcodeByValue(group.barcode, allGroupItems)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent-green/10 border border-accent-green/20 text-accent-green text-xs font-medium hover:bg-accent-green/20 transition-colors"
                              >
                                <Printer size={11} /> Chop ({totalCount})
                              </button>
                              <button
                                onClick={() => handleDownloadGroupBarcodeByValue(group.barcode, allGroupItems)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs font-medium hover:bg-accent-blue/20 transition-colors"
                              >
                                <Download size={11} /> Yuklab ({totalCount})
                              </button>
                              {hasUnbarcoded && (
                                <button
                                  onClick={() => handleAddToGroup(group)}
                                  disabled={isGenerating}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent-orange/10 border border-accent-orange/20 text-accent-orange text-xs font-medium hover:bg-accent-orange/20 transition-colors disabled:opacity-50"
                                >
                                  {isGenerating
                                    ? <div className="w-3 h-3 border border-accent-orange border-t-transparent rounded-full animate-spin" />
                                    : <Plus size={11} />
                                  }
                                  Guruhga qo'shish
                                </button>
                              )}
                              <button
                                onClick={() => handleConvertGroupToPerItem(group)}
                                disabled={isGenerating}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-bg-tertiary border border-border text-text-muted text-xs hover:text-text-primary hover:border-border transition-all disabled:opacity-50"
                                title="Barcha itemlarga alohida barkod yaratish"
                              >
                                {isGenerating
                                  ? <div className="w-3 h-3 border border-text-muted border-t-transparent rounded-full animate-spin" />
                                  : <Hash size={11} />
                                }
                                Alohida barkodga o'tkazish
                              </button>
                              <button
                                onClick={() => setAttrEditModal({ batchIds: group.batches.map(b => b.id), attrs: { ...group.attributes } })}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-bg-tertiary border border-border text-text-muted text-xs hover:text-text-primary hover:border-accent-blue transition-all"
                                title="Xususiyatlarni o'zgartirish"
                              >
                                <Pencil size={11} />
                              </button>
                              <button
                                onClick={() => setDeleteGroupModal({ group })}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
                                title="Umumiy barkodni o'chirish"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* === Bo'lim 2: Alohida barkodlar (per-item) === */}
                  {perItemBatches.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">Alohida barkodlar</p>
                      {perItemBatches.map(batch => {
                        const { bItems, withBarcode, withoutBarcode } = getBatchBarcodeState(batch.id)
                        const isGenerating = generatingBatch === batch.id
                        const hasAttrs = batch.attributes && Object.keys(batch.attributes).length > 0
                        const batchDate = batch.receivedAt ? new Date(batch.receivedAt).toLocaleDateString('uz-UZ') : '—'
                        const needBarcode = withoutBarcode.length > 0

                        return (
                          <div key={batch.id} className="border border-border rounded-xl overflow-hidden">
                            <div className="px-4 pt-3 pb-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1 flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-xs font-semibold text-text-primary">Kirim: {batchDate}</p>
                                    {needBarcode && (
                                      <span className="px-1.5 py-0.5 rounded-full bg-accent-orange/15 border border-accent-orange/30 text-accent-orange text-[10px] font-bold">
                                        {withoutBarcode.length} ta barkod yo'q
                                      </span>
                                    )}
                                  </div>
                                  {batch.supplierName && <p className="text-[11px] text-text-muted">{batch.supplierName}</p>}
                                  {hasAttrs && <AttrBadges attributes={batch.attributes} />}
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-sm font-bold text-text-primary">{bItems.length}</p>
                                  <p className="text-[10px] text-text-muted">{batch.unit || 'dona'}</p>
                                </div>
                              </div>
                            </div>
                            <div className="px-4 pb-3 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge cls="text-text-secondary bg-bg-tertiary border border-border">Alohida {withBarcode.length} ta</Badge>
                                <button
                                  onClick={() => handleConvertToGroup(batch)}
                                  disabled={isGenerating}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-accent-orange/10 border border-accent-orange/20 text-accent-orange text-[10px] font-medium hover:bg-accent-orange/20 transition-colors disabled:opacity-50"
                                >
                                  <Layers size={9} /> Umumiy barkodga o'tkazish
                                </button>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  onClick={() => setDetailModal({ type: 'peritem', batch })}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-bg-tertiary border border-border text-text-muted text-xs hover:text-text-primary hover:border-accent-blue transition-all"
                                >
                                  <Eye size={11} /> Batafsil
                                </button>
                                <button
                                  onClick={() => setAttrEditModal({ batchIds: [batch.id], attrs: { ...(batch.attributes || {}) } })}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-bg-tertiary border border-border text-text-muted text-xs hover:text-text-primary hover:border-accent-blue transition-all"
                                  title="Xususiyatlarni o'zgartirish"
                                >
                                  <Pencil size={11} />
                                </button>
                                <button
                                  onClick={() => handlePrintPerItem(batch)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent-green/10 border border-accent-green/20 text-accent-green text-xs font-medium hover:bg-accent-green/20 transition-colors"
                                >
                                  <Printer size={11} /> Barcha chop ({withBarcode.length})
                                </button>
                                <button
                                  onClick={() => handleDownloadAllPerItem(batch)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-xs font-medium hover:bg-accent-blue/20 transition-colors"
                                >
                                  <Download size={11} /> Barcha yuklab ({withBarcode.length})
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* === Bo'lim 3: Barkod yo'q === */}
                  {noBarcodeBatches.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-1">Barkod yo'q</p>
                      {noBarcodeBatches.map(batch => {
                        const { bItems, withoutBarcode } = getBatchBarcodeState(batch.id)
                        const isGenerating = generatingBatch === batch.id
                        const hasAttrs = batch.attributes && Object.keys(batch.attributes).length > 0
                        const batchDate = batch.receivedAt ? new Date(batch.receivedAt).toLocaleDateString('uz-UZ') : '—'

                        return (
                          <div key={batch.id} className="border border-accent-orange/25 bg-accent-orange/[0.03] rounded-xl overflow-hidden">
                            <div className="px-4 pt-3 pb-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1 flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-xs font-semibold text-text-primary">Kirim: {batchDate}</p>
                                    <span className="px-1.5 py-0.5 rounded-full bg-accent-orange/15 border border-accent-orange/30 text-accent-orange text-[10px] font-bold">
                                      {withoutBarcode.length} ta barkod yo'q
                                    </span>
                                  </div>
                                  {batch.supplierName && <p className="text-[11px] text-text-muted">{batch.supplierName}</p>}
                                  {hasAttrs && <AttrBadges attributes={batch.attributes} />}
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-sm font-bold text-text-primary">{bItems.length}</p>
                                  <p className="text-[10px] text-text-muted">{batch.unit || 'dona'}</p>
                                </div>
                              </div>
                            </div>
                            <div className="px-4 pb-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <p className="text-[11px] font-semibold text-accent-orange">Barkod yaratish rejimini tanlang:</p>
                                <button
                                  onClick={() => setAttrEditModal({ batchIds: [batch.id], attrs: { ...(batch.attributes || {}) } })}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-bg-tertiary border border-border text-text-muted text-[10px] hover:text-text-primary hover:border-accent-blue transition-all"
                                  title="Xususiyatlarni o'zgartirish"
                                >
                                  <Pencil size={9} /> Xususiyat
                                </button>
                              </div>
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
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {groupCards.length === 0 && perItemBatches.length === 0 && noBarcodeBatches.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <Tag size={32} className="text-text-muted" />
                      <p className="text-xs text-text-muted">Omborda tovar qolmagan</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Barcha barkodlar jadvali */}
        <div className="lg:col-span-5 bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 flex flex-col mt-4 sm:mt-6" style={{ minHeight: '520px' }}>
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
            <table className="w-full text-left text-sm border-collapse" style={{ tableLayout: 'auto' }}>
              <thead className="bg-bg-tertiary">
                <tr>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap" onClick={() => handleSort1('batchDate')}>
                    <span className="inline-flex items-center gap-1">{t('wh_bc_income_date')} <SortIcon field="batchDate" sortField={sort1Field} sortDir={sort1Dir} /></span>
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap" onClick={() => handleSort1('productName')}>
                    <span className="inline-flex items-center gap-1">{t('col_product')} <SortIcon field="productName" sortField={sort1Field} sortDir={sort1Dir} /></span>
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap" onClick={() => handleSort1('barcodeDate')}>
                    <span className="inline-flex items-center gap-1">{t('wh_bc_bc_date')} <SortIcon field="barcodeDate" sortField={sort1Field} sortDir={sort1Dir} /></span>
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase tracking-wider">{t('wh_modal_barcode')}</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase tracking-wider whitespace-nowrap">Rejim</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase tracking-wider whitespace-nowrap">Chop/Yuk</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap" onClick={() => handleSort1('status')}>
                    <span className="inline-flex items-center gap-1">{t('col_status')} <SortIcon field="status" sortField={sort1Field} sortDir={sort1Dir} /></span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allBarcodesPagedItems.map(item => {
                  const { label, cls } = getItemStatus(item, t)
                  const batchDate = item.batchDate ? new Date(item.batchDate).toLocaleDateString('uz-UZ') : '—'
                  const barcodeDate = item.barcodeCreatedAt ? new Date(item.barcodeCreatedAt).toLocaleDateString('uz-UZ') : '—'
                  const countLabel = [
                    item.printCount > 0 ? `chop ${item.printCount}x` : '',
                    item.downloadCount > 0 ? `yuk ${item.downloadCount}x` : '',
                  ].filter(Boolean).join(', ') || '—'
                  const isGroupBc = item.barcode && item.barcode.includes('-G')
                  return (
                    <tr key={item.id} className="hover:bg-bg-tertiary/20 transition-colors">
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs text-text-muted">{batchDate}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-text-primary truncate">{item.productName}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs text-text-muted">{barcodeDate}</td>
                      <td className={`px-3 sm:px-4 py-2 sm:py-3 font-mono text-xs text-text-primary ${barcodeSelectClass}`}>{item.barcode || '—'}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        {item.barcode && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isGroupBc ? 'bg-accent-blue/10 text-accent-blue' : 'bg-bg-tertiary text-text-muted'}`}>
                            {isGroupBc ? 'Umumiy' : 'Alohida'}
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs text-text-muted whitespace-nowrap">{countLabel}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>{label}</span>
                      </td>
                    </tr>
                  )
                })}
                {allBarcodesPagedItems.length === 0 && (
                  <tr><td colSpan={7} className="px-3 sm:px-4 py-12 text-center text-xs text-text-muted">{t('wh_bc_not_found')}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-text-muted">{Math.min(allBarcodesPage * ALL_BARCODES_PER_PAGE, allBarcodeItems.length)} / {allBarcodeItems.length} ta</p>
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
        <div className="lg:col-span-5 bg-bg-secondary border border-border rounded-2xl p-4 sm:p-6 flex flex-col mt-4 sm:mt-6" style={{ minHeight: '420px' }}>
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
            <table className="w-full text-left text-sm border-collapse" style={{ tableLayout: 'auto' }}>
              <thead className="bg-bg-tertiary">
                <tr>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap" onClick={() => handleSort2('batchDate')}>
                    <span className="inline-flex items-center gap-1">{t('wh_bc_income_date')} <SortIcon field="batchDate" sortField={sort2Field} sortDir={sort2Dir} /></span>
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap" onClick={() => handleSort2('productName')}>
                    <span className="inline-flex items-center gap-1">{t('col_product')} <SortIcon field="productName" sortField={sort2Field} sortDir={sort2Dir} /></span>
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap" onClick={() => handleSort2('barcodeDate')}>
                    <span className="inline-flex items-center gap-1">{t('wh_bc_bc_date')} <SortIcon field="barcodeDate" sortField={sort2Field} sortDir={sort2Dir} /></span>
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase tracking-wider">{t('wh_modal_barcode')}</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase tracking-wider">{t('wh_bc_sold_date')}</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap" onClick={() => handleSort2('status')}>
                    <span className="inline-flex items-center gap-1">{t('col_status')} <SortIcon field="status" sortField={sort2Field} sortDir={sort2Dir} /></span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {soldPagedItems.map(item => {
                  const batchDate = item.batchDate ? new Date(item.batchDate).toLocaleDateString('uz-UZ') : '—'
                  const barcodeDate = item.barcodeCreatedAt ? new Date(item.barcodeCreatedAt).toLocaleDateString('uz-UZ') : '—'
                  const soldDate = item.soldAt ? new Date(item.soldAt).toLocaleDateString('uz-UZ') : (item.barcodeCreatedAt ? new Date(item.barcodeCreatedAt).toLocaleDateString('uz-UZ') : '—')
                  return (
                    <tr key={item.id} className="hover:bg-bg-tertiary/20 transition-colors">
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs text-text-muted">{batchDate}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-text-primary truncate">{item.productName}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs text-text-muted">{barcodeDate}</td>
                      <td className={`px-3 sm:px-4 py-2 sm:py-3 font-mono text-xs text-text-primary ${barcodeSelectClass}`}>{item.barcode}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs text-text-muted">{soldDate}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-bg-tertiary text-text-muted">{t('sold')}</span>
                      </td>
                    </tr>
                  )
                })}
                {soldPagedItems.length === 0 && (
                  <tr><td colSpan={6} className="px-3 sm:px-4 py-12 text-center text-xs text-text-muted">{t('wh_bc_sold_not_found')}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-text-muted">{Math.min(soldBarcodesPage * SOLD_PER_PAGE, soldBarcodeItems.length)} / {soldBarcodeItems.length} ta</p>
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
