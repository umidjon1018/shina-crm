import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Search, Tag, Printer, Download, Lock, CheckSquare, Square } from 'lucide-react'
import { generateBarcodes, updateBarcodeStatus } from '../../../api/itemService'
import { getCategoryColor } from '../../../utils/categoryColors'
import { getItemStatus } from '../../../utils/itemStatus'
import JsBarcode from 'jsbarcode'
import { Badge, isPrivileged } from '../whHelpers.jsx'

const BarcodeTab = ({ products, items, userRole, userId, userName, downloadEnabled, notificationSettings, addNotification, onRefresh }) => {
  const { t } = useTranslation()
  const barcodeSelectClass = userRole === 'admin' ? '' : 'select-none'
  const canReprint = isPrivileged(userRole)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productSearch, setProductSearch] = useState('')
  const [productItems, setProductItems] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [generating, setGenerating] = useState(false)
  const [actionStatus, setActionStatus] = useState({})
  const svgContainerRef = useRef({})

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
    p.brand.toLowerCase().includes(productSearch.toLowerCase())
  )

  const loadProductItems = async (product) => {
    setSelectedProduct(product)
    setSelectedIds([])
    setActionStatus({})
    const allItems = items.filter(i => i.productId === product.id && i.status === 'in_stock')
    
    // Sort items by barcodeStatus: printed (0) -> downloaded (1) -> active (2) -> inactive (3) -> null (4)
    const sorted = [...allItems].sort((a, b) => {
      const order = { printed: 0, downloaded: 1, active: 2, inactive: 3 }
      const aVal = a.barcodeStatus === null ? 4 : (order[a.barcodeStatus] ?? 3)
      const bVal = b.barcodeStatus === null ? 4 : (order[b.barcodeStatus] ?? 3)
      return aVal - bVal
    })
    
    setProductItems(sorted)
    const noBarcode = sorted.filter(i => !i.barcode).map(i => i.id)
    setSelectedIds(noBarcode)
  }

  // Chop etilgan yoki yuklab olingan item → faqat reprintAllowed bo'lsa tanlash mumkin
  const isItemLocked = (item) =>
    (item.barcodeStatus === 'printed' || item.barcodeStatus === 'downloaded') && !item.reprintAllowed

  const toggleSelect = (id) => {
    const item = productItems.find(i => i.id === id)
    if (item && isItemLocked(item)) return
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleSelectNew = () => {
    const newIds = productItems
      .filter(i => i.barcode && i.barcodeStatus === 'active' && !isItemLocked(i))
      .map(i => i.id)
    const allSelected = newIds.length > 0 && newIds.every(id => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !newIds.includes(id)))
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...newIds])])
    }
  }

  const toggleSelectAll = () => {
    const allIds = productItems
      .filter(i => i.barcode && !isItemLocked(i))
      .map(i => i.id)
    const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.includes(id))
    if (allSelected) setSelectedIds([])
    else setSelectedIds(allIds)
  }

  const handleGenerate = async () => {
    if (!selectedIds.length) return
    setGenerating(true)
    try {
      const updated = await generateBarcodes(selectedIds, userId)
      const updatedIds = updated.map(u => u.id)
      setProductItems(prev => prev.map(item => {
        const upd = updated.find(u => u.id === item.id)
        return upd ? { ...item, ...upd } : item
      }))
      // Yangi yaratilgan barkodlarni avtomatik belgilash
      setSelectedIds(updatedIds)
      // items prop ni yangilash — allBarcodes jadvali ham ko'rinsin
      onRefresh?.()
    } finally { setGenerating(false) }
  }

  useEffect(() => {
    productItems.forEach(item => {
      if (!item.barcode) return
      setTimeout(() => {
        try {
          JsBarcode(`#bc-${item.id}`, item.barcode, {
            format: 'CODE128', width: 1.5, height: 40,
            displayValue: true, fontSize: 10, margin: 6,
            background: 'transparent', lineColor: 'currentColor',
          })
        } catch {}
      }, 80)
    })
  }, [productItems])

  const selectedItemsWithBarcode = productItems.filter(i => selectedIds.includes(i.id) && i.barcode)
  const selectedWithoutBarcode = productItems.filter(i => selectedIds.includes(i.id) && !i.barcode)

  const handleDownloadSelected = async () => {
    for (const item of selectedItemsWithBarcode) {
      const svg = document.getElementById('bc-' + item.id)
      if (!svg) continue
      const canvas = document.createElement('canvas')
      const bbox = svg.getBoundingClientRect()
      canvas.width = bbox.width * 2 || 400
      canvas.height = bbox.height * 2 || 160
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#0F1520'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const data = new XMLSerializer().serializeToString(svg)
      await new Promise(resolve => {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          const a = document.createElement('a')
          a.download = item.barcode + '.png'
          a.href = canvas.toDataURL('image/png')
          a.click()
          resolve()
        }
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)))
      })
      await new Promise(r => setTimeout(r, 300))
    }
    await updateBarcodeStatus(selectedItemsWithBarcode.map(i => i.id), { status: 'downloaded', reprintAllowed: false })
    setActionStatus(prev => {
      const next = { ...prev }
      selectedItemsWithBarcode.forEach(i => { next[i.id] = 'downloaded' })
      return next
    })
    setProductItems(prev => prev.map(i =>
      selectedItemsWithBarcode.find(s => s.id === i.id)
        ? { ...i, barcodeStatus: 'downloaded', downloadCount: (i.downloadCount || 0) + 1, reprintAllowed: false }
        : i
    ))
    // Qayta yuklab olingan itemlar uchun salbiy baho
    const redownloaded = selectedItemsWithBarcode.filter(i => i.barcodeStatus === 'downloaded' || i.barcodeStatus === 'printed')
    if (redownloaded.length > 0 && notificationSettings?.BARCODE_REPRINTED !== false) {
      redownloaded.forEach(item => {
        const prod = products.find(p => p.id === item.productId)
        addNotification({
          type: 'BARCODE_REDOWNLOADED',
          severity: 'warning',
          title: 'Barkod qayta yuklab olindi',
          message: `"${prod?.name || item.barcode}" (${item.barcode}) barkodi ${(item.downloadCount || 0) + 1}-marta yuklab olindi`,
          titleKey: 'notif_title_barcode_redownloaded',
          messageKey: 'notif_msg_barcode_redownloaded',
          messageParams: { name: prod?.name || item.barcode, barcode: item.barcode, count: (item.downloadCount || 0) + 1 },
          barcode: item.barcode,
          itemId: item.id,
          sellerId: userId,
          sellerName: userName,
        })
      })
    }
    onRefresh?.()
  }

  const handlePrintSelected = async () => {
    const svgContents = selectedItemsWithBarcode.map(item => {
      const svg = document.getElementById('bc-' + item.id)
      return svg ? svg.outerHTML : ''
    }).filter(Boolean)
    if (!svgContents.length) return
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html><body style="margin:0;background:#0F1520;display:flex;flex-wrap:wrap;gap:8px;padding:8px;">
        ${svgContents.map(s => `<div style="background:#0F1520;padding:4px;">${s}</div>`).join('')}
      </body></html>
    `)
    printWindow.document.close()
    printWindow.print()
    printWindow.close()
    await updateBarcodeStatus(selectedItemsWithBarcode.map(i => i.id), { status: 'printed', reprintAllowed: false })
    setActionStatus(prev => {
      const next = { ...prev }
      selectedItemsWithBarcode.forEach(i => { next[i.id] = 'printed' })
      return next
    })
    setProductItems(prev => prev.map(i =>
      selectedItemsWithBarcode.find(s => s.id === i.id)
        ? { ...i, barcodeStatus: 'printed', printCount: (i.printCount || 0) + 1, reprintAllowed: false }
        : i
    ))
    const reprinted = selectedItemsWithBarcode.filter(i => i.barcodeStatus === 'printed' || i.barcodeStatus === 'downloaded')
    if (reprinted.length > 0 && notificationSettings?.BARCODE_REPRINTED !== false) {
      reprinted.forEach(item => {
        const prod = products.find(p => p.id === item.productId)
        addNotification({
          type: 'BARCODE_REPRINTED',
          severity: 'warning',
          title: 'Barkod qayta chop etildi',
          message: `"${prod?.name || item.barcode}" (${item.barcode}) barkodi ${(item.printCount || 0) + 1}-marta chop etildi`,
          titleKey: 'notif_title_barcode_reprinted',
          messageKey: 'notif_msg_barcode_reprinted',
          messageParams: { name: prod?.name || item.barcode, barcode: item.barcode, count: (item.printCount || 0) + 1 },
          barcode: item.barcode,
          itemId: item.id,
          sellerId: userId,
          sellerName: userName,
        })
      })
    }
    onRefresh?.()
  }

  // getStatusLabel — src/utils/itemStatus.js dan import qilingan getItemStatus ishlatiladi

  // Barcha itemlar — barchasi (barcode bo'lsa ham bo'lmasa ham)
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
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Left: product list */}
      <div className="lg:col-span-2 bg-bg-secondary border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-syne font-bold text-text-primary">{t('wh_bc_select_product')}</h3>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder={t('wh_bc_search_ph')} className="w-full pl-9 pr-4 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue transition-colors" />
        </div>
        <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
          {filteredProducts.map(p => {
            const pItems = items.filter(i => i.productId === p.id && i.status === 'in_stock')
            const noBarcodeCount = pItems.filter(i => !i.barcode).length
            return (
              <button
                key={p.id}
                onClick={() => loadProductItems(p)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${selectedProduct?.id === p.id ? 'border-accent-red bg-accent-red/5' : 'border-border hover:border-accent-blue hover:bg-bg-tertiary'}`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-text-primary text-sm">{p.name}</p>
                  {noBarcodeCount > 0 && <Badge cls="text-accent-orange bg-accent-orange/10">{noBarcodeCount} {t('wh_new_product')}</Badge>}
                </div>
                <p className="text-xs text-text-muted mt-0.5">{t('cat_' + p.category, { defaultValue: p.categoryLabel })} · {p.size} · {t('wh_bc_in_stock', { n: pItems.length })}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right: barcode management */}
      <div className="lg:col-span-3 bg-bg-secondary border border-border rounded-2xl p-5 flex flex-col gap-4">
        {!selectedProduct ? (
          <div className="flex flex-col items-center justify-center flex-1 py-16 gap-3">
            <Tag size={40} className="text-text-muted" />
            <p className="text-text-secondary text-sm">{t('wh_bc_select_hint')}</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-syne font-bold text-text-primary text-sm">{selectedProduct.name}</h3>
                <p className="text-xs text-text-muted">{t('wh_bc_in_stock', { n: productItems.length })}</p>
              </div>
              <div className="flex items-center gap-2">
                {productItems.some(i => i.barcode && !isItemLocked(i)) && (
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bg-tertiary border border-border text-text-secondary text-xs font-medium hover:text-text-primary hover:border-accent-blue transition-all"
                  >
                    <CheckSquare size={14} />
                    {t('wh_bc_select_all')}
                  </button>
                )}
                {productItems.some(i => i.barcode && i.barcodeStatus === 'active') && (
                  <button
                    onClick={toggleSelectNew}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bg-tertiary border border-border text-text-secondary text-xs font-medium hover:text-text-primary hover:border-accent-blue transition-all"
                  >
                    <CheckSquare size={14} />
                    {t('wh_bc_select_new')}
                  </button>
                )}
                {selectedWithoutBarcode.length > 0 && (
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-red text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {generating
                      ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <><Tag size={13} /> {t('wh_bc_generate', { n: selectedWithoutBarcode.length })}</>}
                  </button>
                )}
              </div>
            </div>

            {/* Items list */}
            <div className="flex-1 space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {productItems.map(item => {
                const isSelected = selectedIds.includes(item.id)
                const locked = isItemLocked(item)

                return (
                  <div
                    key={item.id}
                    className={`border rounded-xl p-3 transition-all ${
                      locked ? 'border-border opacity-60' :
                      isSelected ? 'border-accent-blue bg-accent-blue/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleSelect(item.id)}
                        className={`flex-shrink-0 transition-colors ${locked ? 'text-text-muted cursor-not-allowed' : 'text-text-muted hover:text-accent-blue'}`}
                        disabled={locked}
                      >
                        {isSelected ? <CheckSquare size={18} className="text-accent-blue" /> : <Square size={18} className={locked ? 'opacity-30' : ''} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        {item.barcode ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-mono text-xs text-text-primary ${locked ? 'select-none' : ''}`}>
                              {item.barcode}
                            </span>
                            {(() => { const { label, cls } = getItemStatus(item, t); return <Badge cls={cls}>{label}</Badge> })()}
                            {locked && (
                              <span className="flex items-center gap-1 text-[10px] text-text-muted">
                                <Lock size={10} /> {t('wh_bc_reprint_hint')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge cls="text-text-muted bg-bg-tertiary">{t('wh_bc_no_barcode')}</Badge>
                            <span className="text-xs text-text-muted">{t('wh_bc_no_barcode_hint')}</span>
                          </div>
                        )}
                        {item.barcode && !locked && (
                          <svg id={`bc-${item.id}`} className="w-full max-w-[180px] text-text-primary mt-1" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom action panel */}
            {selectedItemsWithBarcode.length > 0 && (
              <div className="border-t border-border pt-4 flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-text-muted">
                  {t('wh_bc_selected', { n: selectedItemsWithBarcode.length })}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadSelected}
                    disabled={!downloadEnabled}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      downloadEnabled
                        ? 'bg-accent-blue/10 border border-accent-blue/20 text-accent-blue hover:bg-accent-blue/20'
                        : 'bg-bg-tertiary border border-border text-text-muted cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Download size={15} />
                    {t('wh_bc_download', { n: selectedItemsWithBarcode.length })}
                  </button>
                  <button
                    onClick={handlePrintSelected}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-green/10 border border-accent-green/20 text-accent-green text-sm font-medium hover:bg-accent-green/20 transition-colors"
                  >
                    <Printer size={15} />
                    {t('wh_bc_print', { n: selectedItemsWithBarcode.length })}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Barcha barkodlar jadvali */}
      <div className="lg:col-span-5 bg-bg-secondary border border-border rounded-2xl p-6 flex flex-col mt-6" style={{minHeight: '520px'}}>

        {/* Header */}
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

        {/* Jadval */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse" style={{tableLayout: 'auto'}}>
            <thead className="bg-bg-tertiary">
              <tr>
                <th
                  className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap"
                  style={{minWidth: '110px'}}
                  onClick={() => handleSort1('batchDate')}
                >
                  <span className="inline-flex items-center gap-1">
                    {t('wh_bc_income_date')} <SortIcon field="batchDate" sortField={sort1Field} sortDir={sort1Dir} />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap"
                  onClick={() => handleSort1('productName')}
                >
                  <span className="inline-flex items-center gap-1">
                    {t('col_product')} <SortIcon field="productName" sortField={sort1Field} sortDir={sort1Dir} />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap"
                  style={{minWidth: '110px'}}
                  onClick={() => handleSort1('barcodeDate')}
                >
                  <span className="inline-flex items-center gap-1">
                    {t('wh_bc_bc_date')} <SortIcon field="barcodeDate" sortField={sort1Field} sortDir={sort1Dir} />
                  </span>
                </th>
                <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider" style={{minWidth: '200px'}}>{t('wh_modal_barcode')}</th>
                <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider whitespace-nowrap">Chop/Yuk</th>
                <th
                  className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap"
                  style={{minWidth: '110px'}}
                  onClick={() => handleSort1('status')}
                >
                  <span className="inline-flex items-center gap-1">
                    {t('col_status')} <SortIcon field="status" sortField={sort1Field} sortDir={sort1Dir} />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {allBarcodesPagedItems.map(item => {
                const { label, cls, trCls } = getItemStatus(item, t)
                const batchDate = item.batchDate
                  ? new Date(item.batchDate).toLocaleDateString('uz-UZ')
                  : '—'
                const barcodeDate = item.barcodeCreatedAt
                  ? new Date(item.barcodeCreatedAt).toLocaleDateString('uz-UZ')
                  : '—'
                const countLabel = [
                  item.printCount > 0 ? `chop ${item.printCount}x` : '',
                  item.downloadCount > 0 ? `yuk ${item.downloadCount}x` : '',
                ].filter(Boolean).join(', ') || '—'
                return (
                  <tr key={item.id} className={`hover:bg-bg-tertiary/20 transition-colors ${trCls}`}>
                    <td className="px-4 py-3 text-xs text-text-muted">{batchDate}</td>
                    <td className="px-4 py-3 font-semibold text-text-primary truncate">{item.productName}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">{barcodeDate}</td>
                    <td className={`px-4 py-3 font-mono text-xs text-text-primary ${barcodeSelectClass}`}>{item.barcode || '—'}</td>
                    <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">{countLabel}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>
                        {label}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {allBarcodesPagedItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-xs text-text-muted">{t('wh_bc_not_found')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination — doim pastda */}
        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
          <p className="text-xs text-text-muted">
            {t('wh_bc_pagination', { total: allBarcodeItems.length, page: allBarcodesPage, pages: allBarcodesTotalPages || 1 })}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setAllBarcodesPage(p => Math.max(1, p - 1))}
              disabled={allBarcodesPage === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
            >←</button>
            {Array.from({ length: Math.min(allBarcodesTotalPages, 5) }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setAllBarcodesPage(n)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                  allBarcodesPage === n
                    ? 'bg-accent-red text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                }`}
              >{n}</button>
            ))}
            <button
              onClick={() => setAllBarcodesPage(p => Math.min(allBarcodesTotalPages, p + 1))}
              disabled={allBarcodesPage === allBarcodesTotalPages || allBarcodesTotalPages === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
            >→</button>
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
                <th
                  className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap"
                  style={{minWidth: '110px'}}
                  onClick={() => handleSort2('batchDate')}
                >
                  <span className="inline-flex items-center gap-1">
                    {t('wh_bc_income_date')} <SortIcon field="batchDate" sortField={sort2Field} sortDir={sort2Dir} />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap"
                  onClick={() => handleSort2('productName')}
                >
                  <span className="inline-flex items-center gap-1">
                    {t('col_product')} <SortIcon field="productName" sortField={sort2Field} sortDir={sort2Dir} />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap"
                  style={{minWidth: '110px'}}
                  onClick={() => handleSort2('barcodeDate')}
                >
                  <span className="inline-flex items-center gap-1">
                    {t('wh_bc_bc_date')} <SortIcon field="barcodeDate" sortField={sort2Field} sortDir={sort2Dir} />
                  </span>
                </th>
                <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider" style={{minWidth: '200px'}}>{t('wh_modal_barcode')}</th>
                <th className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider" style={{minWidth: '110px'}}>{t('wh_bc_sold_date')}</th>
                <th
                  className="px-4 py-3 text-text-muted font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-text-primary select-none whitespace-nowrap"
                  style={{minWidth: '100px'}}
                  onClick={() => handleSort2('status')}
                >
                  <span className="inline-flex items-center gap-1">
                    {t('col_status')} <SortIcon field="status" sortField={sort2Field} sortDir={sort2Dir} />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {soldPagedItems.map(item => {
                const batchDate = item.batchDate
                  ? new Date(item.batchDate).toLocaleDateString('uz-UZ') : '—'
                const barcodeDate = item.barcodeCreatedAt
                  ? new Date(item.barcodeCreatedAt).toLocaleDateString('uz-UZ') : '—'
                const soldDate = item.soldAt
                  ? new Date(item.soldAt).toLocaleDateString('uz-UZ')
                  : (item.barcodeCreatedAt
                      ? new Date(item.barcodeCreatedAt).toLocaleDateString('uz-UZ')
                      : '—')
                return (
                  <tr key={item.id} className="hover:bg-bg-tertiary/20 transition-colors">
                    <td className="px-4 py-3 text-xs text-text-muted">{batchDate}</td>
                    <td className="px-4 py-3 font-semibold text-text-primary truncate">{item.productName}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">{barcodeDate}</td>
                    <td className={`px-4 py-3 font-mono text-xs text-text-primary ${barcodeSelectClass}`}>{item.barcode}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">{soldDate}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-bg-tertiary text-text-muted">
                        {t('sold')}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {soldPagedItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-xs text-text-muted">
                    {t('wh_bc_sold_not_found')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
          <p className="text-xs text-text-muted">
            {t('wh_bc_pagination', { total: soldBarcodeItems.length, page: soldBarcodesPage, pages: soldTotalPages || 1 })}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSoldBarcodesPage(p => Math.max(1, p - 1))}
              disabled={soldBarcodesPage === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
            >←</button>
            {Array.from({ length: Math.min(soldTotalPages, 5) }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setSoldBarcodesPage(n)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                  soldBarcodesPage === n
                    ? 'bg-accent-red text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                }`}
              >{n}</button>
            ))}
            <button
              onClick={() => setSoldBarcodesPage(p => Math.min(soldTotalPages, p + 1))}
              disabled={soldBarcodesPage === soldTotalPages || soldTotalPages === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-bg-tertiary text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
            >→</button>
          </div>
        </div>

      </div>
    </div>
  )
}

// ============================
// MAIN PAGE
// ============================

export default BarcodeTab
