// Mobil ilova (Android, MainActivity → window.SicrmNative) bilan ko'prik: chop etish va fayl saqlash.
// WebView'da window.open + print() va <a download> ishlamaydi — ilovada Android oynalariga uzatiladi,
// brauzerda esa avvalgidek.
const native = () => (typeof window !== 'undefined' ? window.SicrmNative : null)

export const isNativeApp = () => !!native()

// To'liq HTML hujjatni chop etish. features — brauzer oynasi o'lchami; keepOpen — chop etgandan keyin oyna qolsin
export const printDocument = (html, { title = 'SICRM', features, delay = 300, keepOpen = false } = {}) => {
  const n = native()
  if (n?.printHtml) {
    n.printHtml(html, String(title).slice(0, 80))
    return true
  }
  const w = window.open('', '_blank', features)
  if (!w) return false
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => {
    w.print()
    if (!keepOpen) w.close()
  }, delay)
  return true
}

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const r = new FileReader()
  r.onload = () => resolve(String(r.result).split(',')[1] || '')
  r.onerror = reject
  r.readAsDataURL(blob)
})

// Faylni saqlash: ilovada "Ulashish" oynasi (Fayllar, Telegram...), brauzerda yuklab olish
export const saveBlob = async (blob, filename) => {
  const n = native()
  if (n?.saveFile) {
    n.saveFile(await blobToBase64(blob), filename, blob.type || 'application/octet-stream')
    return
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
