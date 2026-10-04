// xlsx og'ir (~1MB) — faqat import/eksport bosilganda yuklanadi
let XLSX = null
const loadXLSX = async () => (XLSX ??= await import('xlsx'))

// Kategoriya mapping: foydalanuvchi yozgani → backend qiymati
const CAT_MAP = {
  shina: 'tire', tire: 'tire', шина: 'tire',
  disk: 'wheel', wheel: 'wheel', диск: 'wheel', disc: 'wheel',
  aksessuar: 'accessory', accessory: 'accessory', аксессуар: 'accessory',
}

// Excel shablon ustunlari (tartib muhim)
export const TEMPLATE_COLS = [
  { key: 'sana',              label: 'Sana (kk.oo.yyyy)',               required: false, restrictsSale: false },
  { key: 'tovar_nomi',        label: 'Tovar nomi',                      required: true,  restrictsSale: false },
  { key: 'kategoriya',        label: 'Kategoriya (shina/disk/aksessuar)', required: true,  restrictsSale: false },
  { key: 'yetkazib_beruvchi', label: 'Yetkazib beruvchi',               required: false, restrictsSale: false },
  { key: 'soni',              label: 'Soni',                            required: true,  restrictsSale: false },
  { key: 'olchov',            label: "O'lchov (dona/metr/kg...)",        required: false, restrictsSale: false },
  { key: 'birlik_narx_usd',   label: 'Birlik narxi ($)',                 required: false, restrictsSale: true  },
  { key: 'kurs',              label: 'Kurs (so\'m/$1)',                  required: false, restrictsSale: false },
  { key: 'tolangan_usd',      label: "To'langan ($)",                   required: false, restrictsSale: false },
  { key: 'muddat',            label: "To'lov muddati (kk.oo.yyyy)",     required: false, restrictsSale: false },
  { key: 'izoh',              label: 'Izoh',                            required: false, restrictsSale: false },
]

// dd.mm.yyyy → yyyy-mm-dd
function parseDate(val) {
  if (!val) return null
  const s = String(val).trim()
  // Excel serial number bo'lishi mumkin
  if (/^\d{5}$/.test(s)) {
    const d = XLSX.SSF.parse_date_code(Number(s))
    if (d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`
  }
  const m = s.match(/^(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`
  // yyyy-mm-dd formatda kelsa ham qabul qilsin
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  return null
}

function parseNum(val) {
  if (val === null || val === undefined || val === '') return null
  const n = Number(String(val).replace(/\s/g, '').replace(',', '.'))
  return isNaN(n) ? null : n
}

// Bir qator uchun ogohlantirishlar ro'yxatini hisoblash
// returns { [colKey]: { level: 'red'|'yellow', message: string } }
export function analyzeWarnings(row, currentUsdRate) {
  const w = {}

  if (!row.tovar_nomi || !String(row.tovar_nomi).trim()) {
    w.tovar_nomi = { level: 'red', message: 'Tovar nomini kiriting' }
  }

  const qty = parseNum(row.soni)
  if (qty === null || qty <= 0) {
    w.soni = { level: 'red', message: 'Sonini kiriting (musbat son)' }
  }

  if (!row.kategoriya || !CAT_MAP[String(row.kategoriya).trim().toLowerCase()]) {
    w.kategoriya = { level: 'yellow', message: "Kategoriyani kiriting: shina / disk / aksessuar" }
  }

  const priceUsd = parseNum(row.birlik_narx_usd)
  if (priceUsd === null || priceUsd <= 0) {
    w.birlik_narx_usd = { level: 'red', message: "Birlik narxini kiriting — narxsiz tovar sotilmaydi" }
  }

  if (!row.yetkazib_beruvchi || !String(row.yetkazib_beruvchi).trim()) {
    w.yetkazib_beruvchi = { level: 'yellow', message: "Yetkazib beruvchini kiriting (moliyaviy hisobot uchun)" }
  }

  const rate = parseNum(row.kurs)
  if (!rate || rate <= 0) {
    w.kurs = { level: 'yellow', message: `Kurs kiritilmagan — joriy kurs ishlatiladi (${currentUsdRate?.toLocaleString('uz-UZ') || '—'} so'm/$1)` }
  }

  const sana = row.sana ? parseDate(row.sana) : null
  if (row.sana && !sana) {
    w.sana = { level: 'yellow', message: "Sana formati: kk.oo.yyyy (masalan: 15.08.2026)" }
  }

  const muddat = row.muddat ? parseDate(row.muddat) : null
  if (row.muddat && !muddat) {
    w.muddat = { level: 'yellow', message: "Muddat formati: kk.oo.yyyy (masalan: 15.09.2026)" }
  }

  return w
}

// Qator skip bo'ladimi?
export function isSkippedRow(row) {
  const name = row.tovar_nomi ? String(row.tovar_nomi).trim() : ''
  const qty = parseNum(row.soni)
  if (!name) return { skip: true, reason: 'Tovar nomi bo\'sh' }
  if (qty === null || qty <= 0) return { skip: true, reason: 'Soni kiritilmagan yoki noto\'g\'ri' }
  return { skip: false }
}

// ParsedRow → addBatch uchun tayyor ma'lumot
export function rowToBatchData(row, productId, supplierId, shopId, currentUsdRate) {
  const priceUsd = parseNum(row.birlik_narx_usd) || 0
  const qty = parseNum(row.soni) || 1
  const rate = parseNum(row.kurs) || currentUsdRate || 0
  const paidUsd = parseNum(row.tolangan_usd) || 0
  const totalUsd = priceUsd * qty
  const dueDate = row.muddat ? parseDate(row.muddat) : null
  const receivedAt = row.sana ? parseDate(row.sana) : null

  return {
    productId,
    supplierId,
    shopId,
    quantity: qty,
    unit: row.olchov ? String(row.olchov).trim() : 'dona',
    purchasePriceUSD: priceUsd,
    entryUsdRate: rate,
    paidUSD: Math.min(paidUsd, totalUsd),
    dueDate,
    receivedAt,
    notes: row.izoh ? String(row.izoh).trim() : null,
    paymentStatus: paidUsd >= totalUsd && totalUsd > 0 ? 'paid' : 'unpaid',
  }
}

// Excel faylni parse qilish
export async function parseExcelFile(file) {
  await loadXLSX()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array', cellDates: false })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true })

        // Header mapping: Excel header → bizning key
        const headerMap = {}
        TEMPLATE_COLS.forEach(col => { headerMap[col.label] = col.key })

        // 1-qator — headerlar
        if (!raw.length) return resolve([])

        const rows = raw.map(r => {
          const row = {}
          Object.entries(r).forEach(([h, v]) => {
            const key = headerMap[h.trim()] || null
            if (key) row[key] = v === undefined ? '' : v
          })
          return row
        }).filter(r => Object.keys(r).length > 0)

        resolve(rows)
      } catch (err) {
        reject(new Error('Excel faylni o\'qishda xato: ' + err.message))
      }
    }
    reader.onerror = () => reject(new Error('Fayl o\'qilmadi'))
    reader.readAsArrayBuffer(file)
  })
}

// Kategoriya nomini backend qiymatiga o'tkazish
export function mapCategory(val) {
  if (!val) return null
  return CAT_MAP[String(val).trim().toLowerCase()] || null
}

// yyyy-mm-dd → dd.mm.yyyy
function formatDateDMY(val) {
  if (!val) return ''
  const s = String(val).slice(0, 10)
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[3]}.${m[2]}.${m[1]}`
  return s
}

const CAT_REVERSE = { tire: 'shina', wheel: 'disk', accessory: 'aksessuar' }

// Batchlar ro'yxatini import shablon formatida Excel ga eksport qilish
export async function exportBatchesToExcel(batches, filename = 'qoldiq_eksport.xlsx') {
  await loadXLSX()
  const headers = TEMPLATE_COLS.map(c => c.label)
  const rows = batches.map(b => [
    formatDateDMY(b.receivedAt),
    b.productName || '',
    CAT_REVERSE[b.productCategory] || b.productCategory || '',
    b.supplierName || '',
    b.quantityRemaining ?? b.quantity ?? 0,
    b.unit || 'dona',
    b.purchasePriceUSD || 0,
    b.entryUsdRate || 0,
    b.paidUSD || 0,
    formatDateDMY(b.dueDate),
    b.notes || '',
  ])

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws['!cols'] = headers.map((h, i) => ({ wch: [16, 28, 24, 22, 8, 14, 16, 14, 14, 20, 20][i] || 15 }))
  XLSX.utils.book_append_sheet(wb, ws, 'Qoldiq')
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// Excel shablon fayli generatsiya qilish
export async function generateTemplate() {
  await loadXLSX()
  const headers = TEMPLATE_COLS.map(c => c.label)
  const example = [
    '15.08.2026', 'Michelin 195/65R15', 'shina', 'AutoPlus Toshkent',
    '10', 'dona', '45.00', '13000', '0', '', 'Yozgi partiya'
  ]
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, example])

  // Ustun kengliklari
  ws['!cols'] = headers.map((h, i) => ({ wch: [16, 25, 28, 22, 8, 14, 16, 14, 14, 20, 20][i] || 15 }))

  // Header hujayralarini sariq fon bilan belgilash (majburiy)
  const reqIdx = TEMPLATE_COLS.map((c, i) => c.required ? i : -1).filter(i => i >= 0)
  reqIdx.forEach(ci => {
    const cell = XLSX.utils.encode_cell({ r: 0, c: ci })
    if (ws[cell]) {
      ws[cell].s = { fill: { fgColor: { rgb: 'FFF3CD' } }, font: { bold: true } }
    }
  })

  XLSX.utils.book_append_sheet(wb, ws, 'Kirim')
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
