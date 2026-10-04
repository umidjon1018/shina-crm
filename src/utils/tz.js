// Hisobotlar Toshkent vaqti bo'yicha (UTC+5, yozgi vaqt yo'q).
// Backend vaqtlarni UTC ISO da beradi — tungi 00:00–05:00 dagi sotuv oldingi kunga tushib qolmasligi uchun
// vaqtni "+05:00" offsetli ISO ga aylantiramiz: slice(0,10)/startsWith(oy) mahalliy sana beradi,
// new Date(...) esa aynan o'sha momentni qaytaradi.
const TZ = 'Asia/Tashkent'

const fmt = new Intl.DateTimeFormat('sv-SE', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
})

export const toLocalISO = (v) => {
  if (!v || typeof v !== 'string' || v.length <= 10) return v
  const d = new Date(v)
  if (isNaN(d)) return v
  return fmt.format(d).replace(' ', 'T') + '+05:00'
}

export const localToday = () => toLocalISO(new Date().toISOString()).slice(0, 10)
export const localMonth = () => localToday().slice(0, 7)

// Massivdagi berilgan vaqt maydonlarini mahalliy ISO ga o'tkazadi
export const localizeDates = (arr, fields) =>
  (arr || []).map(x => {
    const o = { ...x }
    for (const f of fields) if (o[f]) o[f] = toLocalISO(o[f])
    return o
  })
