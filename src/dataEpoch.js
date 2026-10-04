// Serverdagi ma'lumotlar tozalanib ID'lar 1 dan boshlanganda, qurilmadagi eski tovar ID'lariga
// bog'langan kesh (rasmlar, savat, bildirishnomalar) yangi tovarlarga yopishib qolmasligi uchun.
// Store'lar localStorage'dan o'qishidan OLDIN ishlashi shart — main.jsx da birinchi import.
const DATA_EPOCH = '2026-10-04'

try {
  if (localStorage.getItem('shina_data_epoch') !== DATA_EPOCH) {
    const raw = localStorage.getItem('goodtires-settings')
    if (raw) {
      const s = JSON.parse(raw)
      if (s?.state) {
        s.state.productImages = {}
        localStorage.setItem('goodtires-settings', JSON.stringify(s))
      }
    }
    localStorage.removeItem('goodtires-cart')
    localStorage.removeItem('goodtires-notifications')
    localStorage.setItem('shina_data_epoch', DATA_EPOCH)
  }
} catch { /* localStorage yopiq bo'lsa — o'tkazib yuboramiz */ }
