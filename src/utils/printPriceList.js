const fp = (n) => Math.round(n || 0).toLocaleString('uz-UZ')
const fdate = () => new Date().toLocaleDateString('uz-UZ')

const SEASON_LABELS = { SUMMER: 'Yoz', WINTER: 'Qish', ALL_SEASON: 'Butun yil', NA: '—' }
const CAT_LABELS = { tire: 'SHINALAR', wheel: 'DISKLAR', accessory: 'AKSESSUARLAR' }
const CAT_ORDER = ['tire', 'wheel', 'accessory']

function getStock(productId, items) {
  return items.filter(i => i.productId === productId && i.status === 'in_stock').length
}

function getAttrSummary(productId, items, attributeDefs) {
  if (!attributeDefs?.length) return ''
  const inStock = items.filter(i => i.productId === productId && i.status === 'in_stock')
  if (!inStock.length) return ''
  return attributeDefs.map(def => {
    const vals = [...new Set(inStock.map(i => i.attributes?.[def.label]).filter(v => v != null && v !== ''))]
    return vals.length ? `${def.label}: ${vals.join(', ')}` : null
  }).filter(Boolean).join(' · ')
}

// ── A4 / A5 jadval format ────────────────────────────────────────────────────

function buildTableHtml({ products, items, attributeDefs, companyName, companyLogo, options, design }) {
  const { format, showInstallment, showStock, showAttrs = true } = options
  const hColor  = design?.headerColor  || '#1c1c2e'
  const aColor  = design?.accentColor  || '#cc0000'
  const font    = design?.font         || 'Arial'
  const logoPos = design?.logoPosition || 'left'
  const footer  = design?.footer       || ''

  const isA5 = format === 'a5'
  const fs = isA5 ? '8.5pt' : '10pt'
  const fsSmall = isA5 ? '7pt' : '8.5pt'

  const logoEl = companyLogo
    ? `<img src="${companyLogo}" style="height:36px;object-fit:contain;">`
    : `<span style="font-size:${isA5 ? '16pt' : '20pt'};font-weight:900;letter-spacing:1px;color:${hColor};">${companyName || 'CRM'}</span>`

  // Logo va sarlavhani joylashtirishda logoPos ga qarab flex tartib
  const headerInner = logoPos === 'right'
    ? `<div style="text-align:left;">
        <div style="font-size:${isA5 ? '14pt' : '17pt'};font-weight:900;color:${hColor};">NARXLAR RO'YXATI</div>
        <div style="font-size:${fsSmall};color:#999;margin-top:2px;">${fdate()}</div>
       </div>${logoEl}`
    : logoPos === 'center'
    ? `<div style="text-align:center;width:100%;">
        ${logoEl}
        <div style="font-size:${isA5 ? '14pt' : '17pt'};font-weight:900;color:${hColor};margin-top:4px;">NARXLAR RO'YXATI</div>
        <div style="font-size:${fsSmall};color:#999;">${fdate()}</div>
       </div>`
    : `${logoEl}<div style="text-align:right;">
        <div style="font-size:${isA5 ? '14pt' : '17pt'};font-weight:900;color:${hColor};">NARXLAR RO'YXATI</div>
        <div style="font-size:${fsSmall};color:#999;margin-top:2px;">${fdate()}</div>
       </div>`

  const extraCols = (showInstallment ? 1 : 0) + (showStock ? 1 : 0) + (showAttrs ? 0 : -1)
  const colCount = 6 + extraCols

  let rowNum = 0
  const bodyRows = CAT_ORDER.flatMap(cat => {
    const catProds = products.filter(p => p.category === cat)
    if (!catProds.length) return []
    const catRow = `<tr>
      <td colspan="${colCount}" style="background:${hColor};color:#fff;font-weight:700;font-size:${fsSmall};
        padding:5px 8px;letter-spacing:1.5px;text-transform:uppercase;">
        ${CAT_LABELS[cat] || cat}
      </td></tr>`
    const prodRows = catProds.map(p => {
      rowNum++
      const attrs = getAttrSummary(p.id, items, attributeDefs)
      const season = SEASON_LABELS[p.season] || '—'
      const stock = getStock(p.id, items)
      const bg = rowNum % 2 === 0 ? '#f7f7f7' : '#fff'
      return `<tr style="background:${bg};">
        <td style="padding:4px 8px;color:#999;text-align:center;font-size:${fsSmall};">${rowNum}</td>
        <td style="padding:4px 8px;font-weight:600;font-size:${fs};">${p.name}</td>
        <td style="padding:4px 8px;color:#555;font-size:${fs};">${p.brand || '—'}</td>
        <td style="padding:4px 8px;color:#555;font-size:${fs};">${p.size || '—'}</td>
        <td style="padding:4px 8px;color:#555;font-size:${fsSmall};">${season}</td>
        ${showAttrs ? `<td style="padding:4px 8px;color:#666;font-size:${fsSmall};">${attrs || '—'}</td>` : ''}
        <td style="padding:4px 8px;font-weight:700;text-align:right;color:${aColor};font-size:${fs};white-space:nowrap;">${fp(p.cashPrice)} so'm</td>
        ${showInstallment ? `<td style="padding:4px 8px;text-align:right;color:#555;font-size:${fsSmall};white-space:nowrap;">${fp(p.installmentBasePrice)} so'm</td>` : ''}
        ${showStock ? `<td style="padding:4px 8px;text-align:center;color:#555;font-size:${fsSmall};">${stock}</td>` : ''}
      </tr>`
    }).join('')
    return catRow + prodRows
  }).join('')

  const footerHtml = footer
    ? `<div style="margin-top:8px;font-size:8pt;color:#777;text-align:center;border-top:1px solid #eee;padding-top:6px;">${footer}</div>`
    : ''

  return `<!DOCTYPE html><html><head>
  <meta charset="utf-8">
  <title>Narxnoma — ${companyName}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: "${font}", sans-serif; background:#fff; color:#111; }
    table { width:100%; border-collapse:collapse; }
    th { background:#f0f0f0; font-size:${fsSmall}; padding:5px 8px; text-align:left;
         border-bottom:2px solid #ccc; white-space:nowrap; }
    th.r { text-align:right; }
    td { border-bottom:1px solid #eee; vertical-align:middle; }
    @media print {
      @page { size:${isA5 ? 'A5' : 'A4'}; margin:8mm; }
      body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    }
  </style>
</head><body>
  <div style="display:flex;justify-content:${logoPos === 'center' ? 'center' : 'space-between'};align-items:center;
              margin-bottom:10px;border-bottom:3px solid ${hColor};padding-bottom:8px;">
    ${headerInner}
  </div>
  <table>
    <thead><tr>
      <th style="width:28px;">#</th>
      <th>Nomi</th>
      <th>Brend</th>
      <th>O'lcham</th>
      <th>Mavsum</th>
      ${showAttrs ? '<th>Xususiyat</th>' : ''}
      <th class="r">Naqd narx</th>
      ${showInstallment ? '<th class="r">Nasiya narxi</th>' : ''}
      ${showStock ? '<th class="r" style="width:50px;">Qoldiq</th>' : ''}
    </tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <div style="margin-top:10px;font-size:7.5pt;color:#bbb;text-align:center;">
    ${companyName} · ${fdate()} · Jami: ${products.length} ta tovar
  </div>
  ${footerHtml}
</body></html>`
}

// ── Vitrina tegi (kichik karta) format ───────────────────────────────────────

function buildCardHtml({ products, items, attributeDefs, companyName, companyLogo, options, design }) {
  const { cardSize, showInstallment, showAttrs = true } = options
  const aColor    = design?.accentColor  || '#cc0000'
  const hColor    = design?.headerColor  || '#1c1c2e'
  const nameColor = design?.logoTextColor|| '#ffffff'
  const font      = design?.font         || 'Arial'
  const logoPos   = design?.logoPosition || 'left'
  const logoMode  = design?.logoMode     || 'normal'
  const footer    = design?.footer       || ''

  const SIZES = {
    small:    { w:'54mm',   h:'38mm',  headerH:'13mm', logoH:'14px', nameSize:'8.5pt', priceSize:'12.5pt', metaSize:'6pt'   },
    medium:   { w:'72mm',   h:'46mm',  headerH:'16mm', logoH:'17px', nameSize:'10pt',  priceSize:'15pt',   metaSize:'7pt'   },
    bankcard: { w:'85.6mm', h:'54mm',  headerH:'19mm', logoH:'20px', nameSize:'11.5pt',priceSize:'17pt',   metaSize:'7.5pt' },
  }
  const s = SIZES[cardSize] || SIZES.medium

  // Logo hizalanishi
  const align = logoPos === 'right' ? 'right' : logoPos === 'center' ? 'center' : 'left'
  const flexAlign = logoPos === 'right' ? 'flex-end' : logoPos === 'center' ? 'center' : 'flex-start'

  // Fon logo (background mode)
  const bgLogoHtml = (logoMode === 'background' && companyLogo)
    ? `<img src="${companyLogo}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;object-position:${align} center;opacity:0.09;pointer-events:none;">`
    : ''

  // Header ichidagi logo (normal mode)
  const headerLogoHtml = logoMode === 'normal' && companyLogo
    ? `<img src="${companyLogo}" style="height:${s.logoH};object-fit:contain;display:block;margin-bottom:2px;">`
    : logoMode === 'normal' && !companyLogo
    ? `<div style="font-size:6pt;font-weight:900;color:${nameColor};opacity:0.65;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:1px;">${companyName || ''}</div>`
    : ''

  const cards = products.map(p => {
    const attrs = getAttrSummary(p.id, items, attributeDefs)
    const season = p.season && p.season !== 'NA' ? SEASON_LABELS[p.season] : ''
    const nameHasSize = p.size && p.name?.includes(p.size)
    const meta = [nameHasSize ? null : p.size, season, p.country].filter(Boolean).join(' · ')
    const brandVisible = p.brand && !p.name?.toLowerCase().startsWith(p.brand.toLowerCase())

    return `<div class="card">
      ${bgLogoHtml}
      <div class="card-hdr" style="text-align:${align};align-items:${flexAlign};">
        ${headerLogoHtml}
        <div class="name">${p.name}</div>
      </div>
      <div class="card-body">
        ${brandVisible ? `<div class="brand">${p.brand}</div>` : ''}
        ${meta ? `<div class="meta">${meta}</div>` : ''}
        ${showAttrs && attrs ? `<div class="attr">${attrs}</div>` : ''}
        <div class="price">${fp(p.cashPrice)} <span class="som">so'm</span></div>
        ${showInstallment && p.installmentBasePrice ? `<div class="inst">Nasiya: ${fp(p.installmentBasePrice)} so'm</div>` : ''}
      </div>
    </div>`
  }).join('')

  return `<!DOCTYPE html><html><head>
  <meta charset="utf-8">
  <title>Vitrina teglari — ${companyName}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: "${font}", sans-serif; background:#fff; }
    .grid { display:flex; flex-wrap:wrap; gap:3mm; padding:5mm; }
    .card {
      position:relative;
      width:${s.w}; height:${s.h};
      border:1px dashed #ccc;
      border-radius:2mm;
      overflow:hidden;
      display:flex; flex-direction:column;
      page-break-inside:avoid;
    }
    .card-hdr {
      background:${hColor};
      min-height:${s.headerH};
      padding:2.5mm 3.5mm 2mm;
      display:flex; flex-direction:column;
      justify-content:center;
    }
    .card-body {
      flex:1; padding:1.5mm 3.5mm;
      display:flex; flex-direction:column;
      justify-content:center;
      gap:0.7mm;
      overflow:hidden;
    }
    .name  { font-size:${s.nameSize};  font-weight:900; color:${nameColor}; line-height:1.2; }
    .brand { font-size:${s.metaSize};  font-weight:700; color:#555; }
    .meta  { font-size:${s.metaSize};  color:#666; }
    .attr  { font-size:${s.metaSize};  color:#888; }
    .price { font-size:${s.priceSize}; font-weight:900; color:${aColor}; margin-top:1mm; line-height:1; }
    .som   { font-size:70%; font-weight:400; }
    .inst  { font-size:${s.metaSize};  color:#555; }
    @media print {
      @page { size:A4; margin:5mm; }
      body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    }
  </style>
</head><body>
  <div class="grid">${cards}</div>
  ${footer ? `<div style="margin-top:4mm;font-size:7.5pt;color:#999;text-align:center;padding:0 5mm;">${footer}</div>` : ''}
</body></html>`
}

// ── Asosiy eksport ───────────────────────────────────────────────────────────

export function printPriceList({ products, items, attributeDefs, companyName, companyLogo, options, design }) {
  const { onlyInStock } = options
  const list = onlyInStock ? products.filter(p => getStock(p.id, items) > 0) : products

  const win = window.open('', '_blank', 'width=960,height=720')
  if (!win) { alert('Pop-up bloklangan. Brauzer sozlamalaridan ruxsat bering.'); return }

  const html = (options.format === 'card')
    ? buildCardHtml({ products: list, items, attributeDefs, companyName, companyLogo, options, design })
    : buildTableHtml({ products: list, items, attributeDefs, companyName, companyLogo, options, design })

  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 600)
}
