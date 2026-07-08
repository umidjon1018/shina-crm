# AI Agent sahifasini qayta qurish — Texnik topshiriq

## Maqsad

Hozirgi AI Agent sahifasi shunchaki "4 ta karta + bitta umumiy chat oynasi" ko'rinishida ishlangan
(ChatGPT-uslubidagi interfeys). Bu noto'g'ri yondashuv. Har bir agent shunchaki "savol-javob bot"
emas — har biri o'z sohasini **nazorat qiluvchi, tahlil qiluvchi va tavsiya beruvchi** modul bo'lishi
kerak. Sahifa butunlay qaytadan quriladi, eski chat-markazli komponent o'chiriladi.

Backend/Postgres/Fastify HALI YO'Q. Bu bosqichda hammasi frontend (React 19 + Zustand) va mavjud
mock-data'lar ustida ishlaydi, lekin "vizual maket" emas — haqiqiy hisob-kitob va dinamik bog'lanish
bo'lishi kerak (masalan marja foizi MOCK_SALES'dan real hisoblanadi, qattiq yozilgan son bo'lmaydi).

Backend ulanganda nima o'zgarishi kerakligi `AI_AGENT_BACKEND_TODO.md` faylida alohida yozilgan —
shu faylni ham loyiha papkasiga saqla va o'zgartirma, faqat backend bosqichida qaytadan ko'rib chiqiladi.

---

## 1. Umumiy struktura (Tab-based, sahifa emas)

AI Agent bo'limi — bitta sahifa, ichida tab navigatsiyasi:

```
AI Agent
├── Tab: Bosh sahifa (umumiy ko'rinish + Faoliyat lentasi)
├── Tab: Savdo agenti
├── Tab: PR/Marketing agenti
├── Tab: Mijoz muloqoti agenti
└── Tab: Tovar bazasi agenti
```

Eski layout (chap tomonda agent ro'yxati + o'ng tomonda bitta umumiy chat) OLIB TASHLANADI.
Har bir tab — to'liq mustaqil komponent, chunki agentlarning vazifalari bir-biriga butunlay
o'xshamaydi (moliyaviy dashboard vs ombor jadvali vs kontent kalendar vs suhbatlar ro'yxati).

### Fayl strukturasi (taklif)

```
src/pages/AIAgent/
  index.jsx                    -> Tab container, routing
  AgentOverviewTab.jsx         -> "Bosh sahifa" tab (4 agent status kartasi + Activity Feed)
  SalesAgentTab.jsx            -> Savdo agenti
  MarketingAgentTab.jsx        -> PR/Marketing agenti
  CustomerAgentTab.jsx         -> Mijoz muloqoti agenti
  InventoryAgentTab.jsx        -> Tovar bazasi agenti
  components/
    AgentActivityFeed.jsx      -> Umumiy "Faoliyat lentasi" komponenti (qayta ishlatiladi)
    AgentStatCard.jsx
    AgentRecommendationCard.jsx
  store/
    agentActivityStore.js      -> Zustand store, markazlashgan log
```

---

## 2. Markazlashgan "Faoliyat lentasi" (Agent Activity Feed)

Bu — eng muhim yangi qism, chunki agentlar orasidagi bog'liqlikni ko'rsatadi (masalan Mijoz
muloqoti agenti bron qilganda, bu Tovar bazasi agentida ham ko'rinishi kerak).

### Zustand store: `agentActivityStore.js`

```js
{
  activities: [
    {
      id: string,
      agentId: 'sales' | 'marketing' | 'customer' | 'inventory',
      type: string,        // 'ANALYSIS' | 'RECOMMENDATION' | 'BOOKING' | 'ALERT' | 'NOTE'
      message: string,     // qisqa, o'zbek tilida tushunarli matn
      relatedAgentId?: string,  // agar boshqa agentga ham tegishli bo'lsa (masalan booking -> inventory)
      relatedEntity?: { type: 'product' | 'client' | 'sale', id: string|number },
      timestamp: ISOString,
    }
  ],
  addActivity: (activity) => void,
  getActivitiesByAgent: (agentId) => array,
}
```

- "Bosh sahifa" tabida to'liq lenta ko'rinadi (eng yangisi tepada, scroll bilan).
- Har bir agent o'z tabida faqat O'ZIGA TEGISHLI (`agentId` yoki `relatedAgentId` mos keladigan)
  faoliyatlarni kichik panelda ko'rsatadi ("Shu agentga aloqador so'nggi harakatlar").
- Demo holatda, sahifa yuklanganda store boshlang'ich mock activity'lar bilan to'ldirilishi mumkin
  (real ssenariy hosil qilish uchun, masalan 5-10 ta tarixiy yozuv).
- Mijoz muloqoti tabida "Bron qilish" demo tugmasi bosilganda:
  1. `addActivity({agentId: 'customer', type: 'BOOKING', message: '...', relatedAgentId: 'inventory', relatedEntity: {...}})`
  2. Tovar bazasi tabiga o'tilganda shu yozuv "Mijoz muloqoti agentidan kelgan bron" sifatida
     alohida ko'rinishda (masalan rang bilan ajratilgan card) chiqib turadi.

---

## 3. Savdo agenti (`SalesAgentTab.jsx`)

**Vazifa ta'rifi (foydalanuvchidan):** Butun sotuvni nazorat qilish, kirim narxi va sotuv o'rtasidagi
hisobotni yuritish, moliyaviy tahlil, bugalter sifatida ishlash, tashkilotning moliyaviy holatini
nazorat qilib to'g'ri qarorlar/yechimlar topish.

### Ma'lumot manbalari (mock)
`MOCK_SALES`, `MOCK_RETURNS`, `MOCK_INCOME_BATCHES`, xarajatlar (Expenses sahifasidagi mock'lar).
Mavjud `categoryColors.js` / `getCategoryColor()` dan foydalanish — boshqa sahifalardagi rang
konventsiyasiga mos bo'lsin.

### Komponent tarkibi

1. **KPI kartalar qatori** (yuqorida, 4-5 ta karta):
   - Jami savdo (tanlangan davr uchun)
   - Sof foyda (savdo − tannarx − xarajatlar, `MOCK_RETURNS` hisobga olingan holda)
   - O'rtacha marja % (umumiy)
   - Qaytarishlar/almashtirishlar ulushi (`MOCK_RETURNS`'dan)
   - Joriy kapital holati (`jalb − yetkazib beruvchi to'lovlari − xarajatlar + sotuv foydasi`
     formulasi — bu loyihada allaqachon belgilangan formula, xuddi shuni ishlat)

2. **Brend/mahsulot bo'yicha marja jadvali**: har bir brend (Lassa, Michelin va h.k.) bo'yicha
   sotilgan miqdor, o'rtacha sotuv narxi, o'rtacha tannarx, marja %, jami foyda. Pasayish/o'sish
   trendini ko'rsatish uchun oldingi davr bilan solishtirish (foiz o'zgarish, qizil/yashil rang).

3. **Kapital oqimi grafigi** (Recharts, loyihada allaqachon ishlatiladi): vaqt bo'yicha kirim/chiqim,
   `MOCK_INCOME_BATCHES` asosida.

4. **"Moliyaviy xulosalar" bloki** (qoida-asosidagi, hozircha shablon):
   - Hisoblangan ko'rsatkichlarga qarab (masalan marja ma'lum chegaradan past tushgan brend,
     yoki qaytarish ulushi yuqori bo'lgan mahsulot) avtomatik xulosa matni generatsiya qilinadi
     JS funksiyasi orqali (`generateFinancialInsights(salesData, returnsData)` kabi), Claude API
     emas — bu sof if/else yoki threshold-asosidagi mantiq.
   - Har bir xulosa `AgentRecommendationCard` orqali ko'rsatiladi, va shu paytda
     `agentActivityStore`ga ham yoziladi (`type: 'ANALYSIS'`).

5. **Pastda kichik chat** ("shu tahlil bo'yicha savol bering"): UI sifatida mavjud, lekin hozircha
   savol yuborilganda statik javob ("Bu funksiya backend ulanganidan keyin ishga tushadi" emas —
   buning o'rniga: foydalanuvchi savol yozganda, mock javoblar to'plamidan (keyword-matching bilan,
   masalan "marja" so'zi bo'lsa marja haqida tayyor javob) eng mosini qaytarish — `BACKEND_TODO`da
   real Claude API integratsiyasi ko'rsatilgan).

---

## 4. Tovar bazasi agenti (`InventoryAgentTab.jsx`)

**Vazifa ta'rifi:** To'liq tovar aylanmasini nazorat qilish; yaxshi sotilayotgan tovar uchun buyurtma
ogohlantirishi; yomon sotilib kam qolgan/tugagan tovar uchun buyurtma kerak-kerakmasligi va
miqdori tavsiyasi; tugagan tovar yangi mavsumga mosligini tahlil qilish.

Bu agent TO'LIQ bajariladi — backend kerak emas, faqat mock-data ustida qoida-asosidagi mantiq.

### Ma'lumot manbalari
Warehouse sahifasidagi mock mahsulotlar ro'yxati (`stock`, `minLimit`, `season`/mavsum maydoni —
agar mavjud bo'lmasa, mock-ga qo'shiladi), `MOCK_SALES` (aylanma tezligini hisoblash uchun).

### Komponent tarkibi

1. **Ombor holati jadvali**: mahsulot, qoldiq, minLimit, oxirgi 30/60 kunlik sotuv tezligi
   (`MOCK_SALES`dan hisoblanadi: necha dona sotilgan / necha kun), "necha kunga yetadi" hisobi.

2. **Tasniflash mantiq** (`classifyInventoryItem(product, salesVelocity, currentMonth)`):
   - **Yaxshi sotilayotgan + kam qolgan** → "Buyurtma qilish tavsiya etiladi" + taxminiy miqdor
     (masalan oxirgi 30 kunlik sotuv tezligi × 2 oy zaxira formula).
   - **Yomon sotilayotgan + kam qolgan/tugagan** → "Buyurtma kerakmi?" savoli ko'tariladi, qaror
     mavsum mantig'iga bog'liq (pastga qarang).
   - **Mavsum mantig'i** (sen yozgan fevral/avgust misoli aynan shu yerda ishlatiladi):
     - Joriy oy + mahsulot mavsumi (`SUMMER`/`WINTER`/`ALL_SEASON`) solishtiriladi.
     - Agar mavsum TUGASH arafasida bo'lsa (masalan qishki shina + fevral oxiri) → "Buyurtma
       BERILMASIN, mavsum yakunlanmoqda" tavsiyasi, qizil/sariq belgi bilan.
     - Agar mavsum BOSHLANISH arafasida bo'lsa (masalan qishki shina + avgust) → "Zudlik bilan
       buyurtma" tavsiyasi, yashil/qizil "muhim" belgi bilan.
     - Bu mantiq sodda kalendar jadval sifatida kodda belgilanadi (qaysi oy qaysi mavsum uchun
       "boshlanish" yoki "tugash" zonasi hisoblanadi) — buni alohida konfiguratsiya fayliga
       (`seasonRules.js`) chiqarish tavsiya etiladi, kelajakda sozlash oson bo'lsin.

3. **Tavsiya kartalari ro'yxati**: yuqoridagi tasniflash natijasida hosil bo'lgan har bir tavsiya
   alohida card sifatida (mahsulot nomi, sabab, tavsiya etilgan miqdor, "Tasdiqlash" tugmasi — demo,
   bosilganda Activity Feedga yoziladi).

4. **Mijoz muloqoti agentidan kelgan bronlar bloki**: agar `agentActivityStore`da
   `relatedAgentId: 'inventory'` bo'lgan `BOOKING` turi faoliyat bo'lsa, alohida ajratilgan
   ro'yxatda ko'rsatiladi ("Mijoz muloqoti agentidan: Gentra egasi 2x205/55R16 bron qildi, muddat:
   ...").

---

## 5. PR/Marketing agenti (`MarketingAgentTab.jsx`)

**Vazifa ta'rifi:** Bazadagi tovarlar savdosini oshirish uchun zarur ma'lumotlarni to'plab, PR
materiallari rejasi/ssenariylarini yozish, postlar tayyorlash; zarur bo'lsa Higgsfield orqali video
tayyorlab Instagramga joylash; Higgsfield MCP ulash imkoniyati.

Bu agentning faqat "kontent reja/g'oya" qismi bajariladi. Real Higgsfield/Instagram — `BACKEND_TODO`.

### Komponent tarkibi

1. **Signal asosidagi kontent g'oyalari**: Tovar bazasi agentining tavsiyalaridan (Activity Feed
   orqali, `relatedAgentId: 'marketing'` yoki umuman `agentId: 'inventory'` bo'lgan `ALERT` turi)
   avtomatik post-g'oya kartalari hosil bo'ladi. Masalan Tovar bazasi "qishki shina kam qoldi,
   mavsum boshlanmoqda" deganda, Marketing tabida "Post g'oyasi: Qishki shina aksiyasi e'lon
   qilish" karta ko'rinadi.
   - Bu bog'lanish — `getMarketingIdeasFromInventoryAlerts()` funksiyasi orqali, Activity Feedni
     o'qib, oddiy mapping qiladi (qoida-asosida, AI generatsiya emas).

2. **Kontent kalendari** (oddiy oylik/haftalik grid ko'rinish, mavjud loyihada Recharts/kalendar
   komponenti bo'lmasa sodda CSS grid bilan): rejalashtirilgan postlar mock ro'yxat sifatida.

3. **Higgsfield MCP ulash bloki**: "Ulanmagan" status badge (rasmda ko'ringan "API kalit yo'q"
   uslubida), "Ulash" tugmasi bosilganda hozircha modal chiqib "Bu integratsiya keyingi bosqichda
   qo'shiladi" deb ko'rsatiladi (window.alert/confirm ISHLATILMAYDI — loyiha qoidasiga ko'ra inline
   modal bo'lishi kerak).

4. **"Instagramga joylash" tugmasi**: har bir post-g'oya kartasida, bosilganda xuddi shunday inline
   modal orqali "Instagram ulanishi kerak" xabari.

---

## 6. Mijoz muloqoti agenti (`CustomerAgentTab.jsx`)

**Vazifa ta'rifi:** Instagram comment/DM'larga javob berish va sotishgacha olib borish (bajarilmaydi);
mijozlarga tug'ilgan kun/bayram tabriklari (mock ko'rinish); xarid xulq-atvoriga qarab segmentatsiya
va aksiya xabarlari (tahlil qilinadi, yuborilmaydi); mavsum oldidan ogohlantirish (ro'yxat sifatida);
Instagram orqali bron qilish oqimi — bron vaqtini belgilab, Tovar bazasi agentini xabardor qilish
(DEMO sifatida to'liq ishlaydi, chunki bu faqat ichki Activity Feed orqali).

### Komponent tarkibi

1. **Mock suhbatlar ro'yxati** (Instagram DM ko'rinishidagi UI, lekin statik mock data): chap tomonda
   suhbat ro'yxati, o'ngda tanlangan suhbat tafsilotlari + mijozning CRM profili (tug'ilgan kun,
   mashina modeli, xarid tarixi, segment — `MOCK_CLIENTS` kabi mock manbadan, agar mavjud bo'lmasa
   shu tab uchun yangi mock yaratiladi).

2. **"Bron qilish" demo tugmasi**: tanlangan suhbatda, mijoz bron so'ragandagi xabarni simulyatsiya
   qilish uchun. Bosilganda:
   - Modal ochiladi: mahsulot tanlash, miqdor, bron muddati.
   - Tasdiqlangandan keyin `agentActivityStore`ga yoziladi (`agentId: 'customer', type: 'BOOKING',
     relatedAgentId: 'inventory'`).
   - Suhbat oynasida ham "Bron qabul qilindi, Tovar bazasi agentiga xabar berildi" degan
     avtomatik javob ko'rinadi.

3. **Tug'ilgan kun/bayram tabriklari bloki**: mock mijozlar ro'yxatidan, joriy sanaga yaqin
   tug'ilgan kuni bor mijozlar ro'yxati ko'rsatiladi ("Yuborish" tugmasi demo, bosilganda Activity
   Feedga yoziladi, real yuborilmaydi).

4. **Segmentatsiya/tavsiya bloki**: mock xarid tarixidan oddiy qoida bilan ("aksiya davrida xarid
   qilganlar" filtri) mijozlar ro'yxati chiqariladi, har biriga "Aksiya xabari yuborish" demo tugmasi.

5. **Mavsum ogohlantirish bloki**: Tovar bazasi agentining mavsum tavsiyalari bilan bog'langan
   (Activity Feed orqali) — "Barcha mijozlarga ogohlantirish yuborish" demo tugmasi, bosilganda
   nechta mijozga "yuborildi" deb ko'rsatiladigan statik natija.

---

## 7. Umumiy texnik talablar (loyiha konventsiyalariga mos)

- `window.confirm`/`window.alert` ISHLATILMAYDI — barcha tasdiqlash/xabar uchun inline modal.
- Rang konventsiyasi: `src/utils/categoryColors.js` dan `getCategoryColor()` orqali, yangi rang
  palitra qo'shilmasin agar mavjud sistema bilan ziddiyat bo'lsa.
- Vaqt formatlash: UTC+5 (loyihada qabul qilingan standart).
- Har bir yangi katta komponent (masalan `SalesAgentTab.jsx`) alohida faylda, 1 page = 1 session
  qoidasiga mos qoling (juda katta bo'lib ketsa, kichik komponentlarga ajratiladi).
- State management: Zustand, mavjud store pattern'iga mos (boshqa store'lar qanday yozilgan bo'lsa
  shunga o'xshash).
- Animatsiya: Framer Motion, mavjud loyihada ishlatilgani kabi (tab almashish, card paydo bo'lishi).

---

## 8. Ishlash tartibi (bosqichlar)

Katta fayllarni bitta sessiyada yozish xato qilishga olib keladi — har bir bosqich alohida.

1. **Bosqich 1**: `agentActivityStore.js` + `AgentActivityFeed.jsx` komponenti + tab container
   (`index.jsx`) — bo'sh tab'lar bilan, faqat navigatsiya ishlasin.
2. **Bosqich 2**: `InventoryAgentTab.jsx` to'liq (bu eng "to'liq bajariladigan" agent, mantiqni
   shu yerda sinab ko'rish kerak).
3. **Bosqich 3**: `SalesAgentTab.jsx` to'liq.
4. **Bosqich 4**: `CustomerAgentTab.jsx` (bron oqimi bilan, chunki Tovar bazasiga bog'lanadi).
5. **Bosqich 5**: `MarketingAgentTab.jsx` (Tovar bazasi signallariga bog'lanadi).
6. **Bosqich 6**: `AgentOverviewTab.jsx` — hammasi tayyor bo'lgandan keyin, to'liq Activity Feed
   va 4 agentning status-summary kartalari.

Har bosqichdan keyin Chrome MCP orqali (`localhost:5173`) tekshirib, keyin davom etish kerak.
