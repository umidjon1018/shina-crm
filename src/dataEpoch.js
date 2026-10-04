// Serverdagi ma'lumotlar tozalanganda qurilmadagi eski kesh yangi ma'lumotlarga yopishib qolmasligi uchun.
// Har bir bosqich qurilmada faqat bir marta ishlaydi; o'tilgan bosqich qayta bajarilmaydi
// (masalan, tozalashdan keyin yuklangan yangi rasmlar o'chib ketmasligi uchun).
// Store'lar localStorage'dan o'qishidan OLDIN ishlashi shart — main.jsx da birinchi import.
const KEY = 'shina_data_epoch'

const STEPS = [
  ['2026-10-04', () => {
    // Tovar ID'lari 1 dan boshlandi: eski rasmlar, savat, bildirishnomalar
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
  }],
  ['2026-10-04b', () => {
    // AI agent lentasi va tahlil keshlari eski ma'lumotlar asosida edi
    localStorage.removeItem('agent-activities-v2')
    Object.keys(localStorage).filter(k => k.startsWith('ai_analysis_v')).forEach(k => localStorage.removeItem(k))
  }],
  ['2026-10-05', () => {
    // Offlayn navbatdagi eski yozuvlar allaqachon serverga yuborilgan sotuvlar — o'chiriladi
    try { indexedDB.deleteDatabase('shina_crm_offline') } catch { /* */ }
  }],
]

try {
  const done = localStorage.getItem(KEY) || ''
  for (const [epoch, run] of STEPS) {
    if (done < epoch) {
      run()
      localStorage.setItem(KEY, epoch)
    }
  }
} catch { /* localStorage yopiq bo'lsa — o'tkazib yuboramiz */ }
