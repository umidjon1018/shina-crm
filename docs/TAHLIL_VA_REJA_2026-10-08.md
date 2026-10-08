# SICRM — to'liq tahlil va qayta tuzish rejasi (2026-10-08)

Frontend (60 ming qator, 13 sahifa) va backend (14 ming qator, 33 route) to'liq ko'rib chiqildi.
Kod o'zgartirilmagan — bu faqat qaror uchun reja.

---

## 0. Qisqa xulosa

1. **Bir nechta funksiya bitta qurilmadan tashqariga chiqmaydi.** Chegirma so'rovi, ogohlantirishlar, komplektlar, USD kursi, nasiya tashkilotlari, audit jurnali va boshqalar faqat **shu brauzerning xotirasida** (localStorage) saqlanadi. Xodimlar telefonda, admin kompyuterda ishlayotgani uchun bular hozir **amalda ishlamayapti**. Bu — eng birinchi tuzatiladigan narsa (Bosqich 0).
2. **Tuzilma tarqoq:** 12 ta menyu, **66 ta tab**. Bir mavzu (masalan, foyda) 7 joyda ko'rinadi, 3–4 xil formula bilan. "Boshqaruv" va "Admin" ikki sahifaga bo'linib ketgan, sozlamalar 6 joyda. Taklif: **10 ta menyu, ~39 ta tab**.
3. **Eski hisobot tablari hamma ma'lumotni telefonga yuklab hisoblaydi** (barcha sotuvlar tarixi har safar). Hozir sezilmaydi, lekin ma'lumot ko'paygani sari sekinlashadi. Yangi tablar esa serverda hisoblaydi — ikki xil yondashuv aralash.
4. **Server nazorati bo'shliqlari:** server sotuv narxini (minimal narx) va chegirma chegarasini tekshirmaydi — bu nazorat faqat brauzerda.

**Tavsiya:** avval Bosqich 0 (ko'rinmas xatolar, UI deyarli o'zgarmaydi). Tablarni birlashtirish (Bosqich 1–3) xodimlar uchun yangi ko'rinish bo'ladi: test oyi oxirida yoki xodimlarni ogohlantirib qilish yaxshi.

---

## 1. Hozirgi xarita

| Menyu | Tablar | Eng katta fayllar |
|---|---|---|
| Bosh sahifa | — | Dashboard 213 + DashboardSummary 169 |
| Ombor | 6: Qoldiq, B/U qoldiq, Kirim, Barkod, Inventarizatsiya, Hisobdan chiqarish | BarcodeTab 1451, StockTab 996 |
| Sotuv | 8: Yangi sotuv, B/U sotuv, Bronlar, Bekor qilish, Sotuv tarixi, Bekor tarixi, Muddatli to'lov, Foyda (+2 tugma: sertifikat, kassa xarajati) | useSalesState **1877**, NewSaleTab 766 |
| Mijozlar | — (profil oynasida 8 ta tab) | index 793, ProfileModal 680 |
| Marketing | 6: Aksiyalar, Promokodlar, Sertifikatlar, Telegram xabarlar, Tug'ilgan kunlar, Sozlamalar | |
| Kirim | 7: Kirimlar, Yetkazib beruvchilar, Qarzlar, Buyurtmalar, Hisob-kitob, To'lovlar tarixi, Qaytarish | index **1802**, BatchesTab 699 |
| Moliya | 7: Xarajatlar, Daromadlar, Pul harakati, Foyda va zarar, Yetkazib beruvchi to'lovlari, Kapital, Kategoriyalar | |
| Hisobotlar | **12**: Sotuv, Tovarlar, Qoldiq, Ombor harakati, Kirim, Mijozlar, Segmentlar, Xodimlar, Do'konlar, Moliya, B/U, Foyda | index **1948**, SalesTab **1813** |
| Integratsiyalar | 4: API, Telegram botda qoldiq, UDS, Payme/Click/Uzum | |
| AI Agent | 4: Kunlik tahlil, AI yordamchi, Statistika, Instagram | |
| Boshqaruv | 6: Ogohlantirishlar, Tovarlar, Xodimlar, Chegirmalar, Komplektlar, Sozlamalar | index **1705**, ProductsTab **1894** |
| Admin | 6: Xodimlar, Qurilmalar, Audit, Do'konlar, AI agentlar, Sozlamalar | |

---

## 2. 🔴 Jiddiy xatolar: ma'lumot faqat bitta qurilmada

Hammasi `localStorage` da — boshqa telefon/kompyuter buni ko'rmaydi. Serverda tegishli jadval yoki sozlama yo'q.

| # | Funksiya | Hozir qanday ishlaydi | Oqibat |
|---|---|---|---|
| 1 | **Chegirma so'rovi** (sotuvchi 5%+ so'raydi) | So'rov sotuvchining o'z telefonidagi ro'yxatga yoziladi | Boshqaruvchi so'rovni **hech qachon ko'rmaydi**; sotuvchi cheksiz kutadi |
| 2 | **Ogohlantirishlar** (Boshqaruv → Ogohlantirishlar, menyudagi qizil raqam): barkodsiz sotuv, mijozsiz sotuv, tovar tugadi, qayta chop | Har qurilma o'zinikini ko'radi | Admin xodim telefonida bo'lgan hodisalarni ko'rmaydi |
| 3 | **Komplektlar** (Boshqaruv → Komplektlar) | `bundleService.js` — "API" deb nomlangan, lekin localStorage | Admin yaratgan komplekt sotuvchi kassasida **yo'q**; hisobotlar (5 tab) va Qaytarish ham komplekt chegirmasini aniqlashda shu mahalliy ro'yxatga tayanadi |
| 4 | **Savdo sozlamalari:** USD kursi, nasiya tashkilotlari (komissiya %), sotuv manbalari, chegirma chegaralari (5/10%), do'kon va xodim oylik rejalari, ogohlantirish yoqish/o'chirish, tovar atributlari, narxnoma sozlamalari, menyu nomlari va **yashirin sahifalar** | `settingsStore` (localStorage). Serverga faqat brend va rollar yoziladi | Admin kompyuterda o'zgartirsa, telefonlarda eski/standart qiymat qoladi (masalan, telefonda faqat "Uzum Nasiya 0%" va "Oddiy Nasiya 3%"). Rejalar faqat kiritilgan qurilmada ko'rinadi. White-label uchun mo'ljallangan "sahifani yashirish" ham telefonlarda ishlamaydi |
| 5 | **Audit jurnali** (Admin → Audit) | localStorage, 5000 yozuvgacha | Admin faqat **o'z brauzerida** qilingan amallarni ko'radi — xodimlar nazorati uchun foydasiz |
| 6 | **Boshqaruvchi xodimni tahrirlashi** (Boshqaruv → Xodimlar) | Serverda xodim tahriri faqat admin uchun → 403, xato jimgina yutiladi | Boshqaruvchi "saqlandi" deb o'ylaydi, sahifa yangilansa o'zgarish yo'qoladi. "Tahrirlashni bloklash", "tahrir tarixi", "o'chirish so'rovi" (Admin → Xodimlar) ham localStorage — amalda ishlamaydi |
| 7 | **AI sozlamalari** (Admin → Sozlamalar: provayder, model, oylik limit, AI yoqish/o'chirish) | Hech qayerda ishlatilmaydi | O'lik tugmalar. AI kaliti ikki joyda (Admin va Boshqaruv), faqat kiritilgan qurilmadan yuboriladi |
| 8 | **"Ishonchli qurilmalar"** (Admin → Qurilmalar pastida) | Eski localStorage ro'yxati | Endi qurilmalar serverda boshqariladi — bu blok ma'nosiz |
| 9 | Marketing yo'l xaritasi (AI → Kunlik tahlil) | localStorage | Faqat bitta qurilmada ko'rinadi (kichik muammo) |

**Yechim (Bosqich 0):**
- Serverda `app_settings` ga `business` kaliti — 4-banddagi hammasi (rollar va brend bilan bir xil usul: serverdan o'qiladi, localStorage faqat oflayn kesh).
- `bundles` jadvali **yoki** komplektni Marketing → Aksiyalar ichiga yangi tur sifatida qo'shish (tavsiya — 5-bo'limga qarang).
- `notifications` jadvali + SSE: chegirma so'rovi real vaqtda boshqaruvchiga boradi, tasdiq sotuvchiga qaytadi. Ogohlantirishlar hammaga ko'rinadi.
- `audit_log` jadvali — muhim amallarni **server** yozadi (narx o'zgarishi, sotuv tahriri/bekor, xodim, qurilma, sozlama).
- Xodim tahriri bo'yicha qaror (8-bo'lim, 4-savol) + xatoni ekranda ko'rsatish.
- O'lik AI sozlamalari va "ishonchli qurilmalar" blokini olib tashlash.

---

## 3. 🟠 Server nazorati va hisob-kitob

| # | Muammo | Tafsilot |
|---|---|---|
| 1 | **Narx nazorati faqat brauzerda** | `POST /api/sales` mijoz yuborgan narxni tekshirmasdan yozadi: `min_sale_price` dan past narx, 0–100% chegirma har qanday rolga ruxsat. Yechim: serverda `price >= min_sale_price` (yoki tasdiqlangan chegirma so'rovi bilan) va rol bo'yicha chegirma chegarasi |
| 2 | **Foyda 3–4 xil formulada** | Brauzer (`profitHelpers`, eski hisobotlar) keshbekni ayirmaydi; Moliya → Foyda va zarar (server) ayiradi; Bosh sahifa (`reportsController`) va AI (`aiSections`) — alohida SQL. Bir davr uchun turli sahifada turli foyda chiqishi mumkin. Yechim: yagona server formulasi |
| 3 | Sotuvchi boshqa do'kon sotuvlarini olishi mumkin | `GET /api/sales` do'konni foydalanuvchiga bog'lamaydi (`shop_id` berilmasa — hammasi) |
| 4 | Sotuvchi xarajat va kapitalni o'qiy oladi | `GET /api/expenses`, `/api/capital` — ochiq savol (CLAUDE.md) |
| 5 | B/U olingan narx yashirilmaydi | `acquired_price` ruxsatsiz foydalanuvchiga ham boradi (kichik) |
| 6 | AI sahifasida tab ruxsati yo'q | Sotuvchida standart `ai_agent` bor → butun biznes tushumi, AI yordamchi ochiq. Foyda yashiriladi, tushum yo'q. Ataylabmi? |
| 7 | Uch xil "standart rol" ro'yxati | `perm.js DEFAULT_TREES`, `settingsStore.roleAccessTrees`, eski `authStore.rolePermissions` / `apHelpers.ROLE_PERMISSIONS` (sotuvchiga "Kirim" bergan eski tizim). Eski ikkitasi o'lik, `employees.permissions` ustuni ham |
| 8 | `ExpenseFormModal` da kurs `12700` qattiq yozilgan | Sozlamadagi kursni olmaydi |

---

## 4. Tarqoq mavzular (bir yo'nalishdagi kartalar)

| Mavzu | Hozir qayerda (soni) | Taklif |
|---|---|---|
| **Foyda** | Bosh sahifa, Sotuv → Foyda, Hisobotlar → Foyda, Hisobotlar → Sotuv, Moliya → Foyda va zarar, AI → Statistika, AI → Savdo (**7**) | Yagona joy: **Moliya → Foyda va zarar**. Bosh sahifada faqat KPI. Sotuv → Foyda va Hisobotlar → Foyda olib tashlanadi |
| **Savdo KPI** (tushum, chek, o'rtacha chek) | Bosh sahifa, AI → Statistika, AI → Savdo, Hisobotlar → Sotuv, Hisobotlar → Do'konlar (**5**) | Bosh sahifa (qisqa) + Hisobotlar → Savdo (batafsil). AI → Statistika → Bosh sahifaga |
| **Yetkazib beruvchi qarzi** | Bosh sahifa, Kirim → Qarzlar, Kirim → Hisob-kitob, Kirim → Yetkazib beruvchilar, Hisobotlar → Kirim, Hisobotlar → Moliya, Moliya → Yetk. to'lovlari (**7**) | Kirim → "Qarz va to'lovlar" (bitta tab) + Moliya → Qarzlar (umumiy ko'rinish) |
| **Yetkazib beruvchiga to'lovlar tarixi** | Kirim → To'lovlar tarixi, Moliya → Yetk. to'lovlari (**2, turli manba!**) | Moliyadagisini olib tashlash — u buyurtma avanslarini ko'rsatmaydi, buyurtmadan kelgan to'lovlarni esa qayta ko'rsatadi |
| **Mijoz qarzi (nasiya)** | Sotuv → Muddatli to'lov, Mijozlar (qarz ustuni), Mijoz profili, Hisobotlar → Moliya, AI → Mijozlar (**5**) | Sotuv → Nasiyalar (ish joyi) + Moliya → Qarzlar (umumiy). Mijoz profili qoladi |
| **Qoldiq / kam qolgan** | Bosh sahifa, Ombor → Qoldiq, Hisobotlar → Qoldiq, Hisobotlar → Ombor harakati, AI → Ombor, Ogohlantirishlar (**6**) | Ombor → Qoldiq (ish) + Hisobotlar → Ombor (tahlil: qoldiq + harakat + B/U) |
| **Pul harakati / kapital** | Moliya → Pul harakati, Moliya → Kapital, Hisobotlar → Moliya (**3**) | Faqat Moliya. Hisobotlar → Moliya tabidagi noyob kartalar (nasiya tashkilotlari hisoboti, mijozlardan kutilayotgan to'lov) → Moliya → Qarzlar |
| **Xodim samaradorligi** | Hisobotlar → Xodimlar, Boshqaruv → Xodimlar (tafsilot oynasi — sotuv statistikasi), AI → Xodimlar, Boshqaruv → Sozlamalar (rejalar) (**4**) | Hisobotlar → Xodimlar (rejalar bilan). Rejani kiritish — Sozlamalar → Savdo qoidalari |
| **Xodimlarni boshqarish** | Admin → Xodimlar, Boshqaruv → Xodimlar (**2**) | Bitta: Sozlamalar → Xodimlar va ruxsatlar |
| **Kirim yaratish** | Ombor → Kirim (forma 1), Kirim → Kirimlar (forma 2 + Excel), Kirim → Buyurtmalar (qabul) (**3, ikki xil forma**) | Bitta umumiy forma komponenti; joy bo'yicha qaror (8-bo'lim, 2-savol) |
| **Barkod** | Ombor → Barkod, Boshqaruv → Tovarlar → Barkodlar (qayta chop ruxsati) (**2**) | Ombor → Barkod (ruxsat tugmasi shu yerda) |
| **Tovar katalogi / narxlar / kategoriyalar** | Boshqaruv → Tovarlar, Ombor → Qoldiq (tovar oynasi, narxnoma) (**2**) | Ombor → Tovarlar |
| **Chegirmalar** | Boshqaruv → Chegirmalar (sodiqlik + chegara), Boshqaruv → Komplektlar, Marketing → Aksiyalar/Promokodlar, Integratsiyalar → UDS (**5**) | Marketing: Aksiyalar (+komplekt turi), Kodlar, Sodiqlik. Chegirma chegarasi → Sozlamalar → Savdo qoidalari |
| **Telegram** | Marketing → Xabarlar, Marketing → Sozlamalar (bot tokeni), Integratsiyalar → Botda qoldiq, Hisobotlar → Telegram tugmasi (xodim), Mijoz profili → Telegram (**5**) | Bot ulanishi bitta joyda: Sozlamalar → Integratsiyalar → Telegram bot (token, rejim, xodimlar, qoldiq). Marketingda faqat xabarlar |
| **Instagram** | AI → Instagram (statistika, DM), Admin → AI agentlar → Mijozlar boti (token, kanallar) (**2**) | Ulanish → Sozlamalar → Integratsiyalar; suhbatlar → AI → Mijozlar boti |
| **Sozlamalar** | Admin → Sozlamalar, Boshqaruv → Sozlamalar, Marketing → Sozlamalar, Integratsiyalar, Admin → AI agentlar, Moliya → Kategoriyalar (**6**) | Bitta **Sozlamalar** sahifasi (bo'limlar bilan) |
| **Sana filtri** | Oy ro'yxati (19 faylda) va davr tanlagich `PeriodPicker` (10 faylda). Hisobotlarda bitta sahifada ikkalasi | Hamma joyda `PeriodPicker` |

---

## 5. Yangi tuzilma taklifi

**Menyu: 12 → 10. Tablar: 66 → ~39.** `[A | B]` — tab ichidagi almashtirgich (alohida tab emas).

### Bosh sahifa
- KPI (serverdan, hozirgidek) + **AI → Statistika shu yerga** (kun/hafta/oy taqqoslash).
- Yangi karta: "Qarzlar" — mijozlar bizga / biz yetkazib beruvchilarga.
- Yangi karta: bugungi AI xulosasi (Kunlik tahlildan qisqa).
- Oxirgi sotuvlar va kam qolgan tovarlar — serverdan (hozir 5 ta to'liq ro'yxat yuklanadi).

### Sotuv (8 → 5)
1. **Kassa** `[Yangi | B/U]`
2. **Bronlar**
3. **Qaytarish** (bekor qilish/almashtirish)
4. **Tarix** `[Sotuvlar | Bekorlar]`
5. **Nasiyalar** (muddatli to'lov)
- ❌ Foyda → Moliya → Foyda va zarar

### Ombor (6 → 5)
1. **Qoldiq** `[Yangi | B/U]`
2. **Tovarlar** ← Boshqaruv → Tovarlar (katalog, narx, kategoriya, atribut, narxnoma)
3. **Kirim** *(qaror: 2-savol)*
4. **Barkod** (+ qayta chop ruxsati Boshqaruvdan)
5. **Nazorat** `[Inventarizatsiya | Hisobdan chiqarish]`

### Kirim (7 → 4)
1. **Kirimlar** `[Kirimlar | Buyurtmalar]` (+ Excel import)
2. **Yetkazib beruvchilar** — profilida akt sverka (Hisob-kitob)
3. **Qarz va to'lovlar** — Qarzlar + To'lovlar tarixi + FIFO to'lash
4. **Qaytarish**

### Mijozlar
- Sahifa o'zgarmaydi. Profil oynasi 8 → 5 tab: Umumiy (+afzalliklar), Xaridlar `[yangi | B/U]`, Moliya `[nasiya | balans]`, Izohlar, Telegram.

### Marketing (6 → 4)
1. **Aksiyalar** (+ yangi tur "Komplekt" ← Boshqaruv → Komplektlar)
2. **Kodlar va sertifikatlar** `[Promokodlar | Sertifikatlar]`
3. **Sodiqlik** ← Boshqaruv → Chegirmalar (jamg'arma chegirma, keshbek)
4. **Xabarlar** `[Telegram tarqatma | Tug'ilgan kunlar]` (tug'ilgan kun matni sozlamasi shu yerda)
- ❌ Sozlamalar → Sozlamalar → Integratsiyalar → Telegram bot

### Moliya (7 → 5)
1. **Xarajat va daromad** `[Xarajatlar | Daromadlar]` (kategoriyalar — tishli tugma)
2. **Pul harakati**
3. **Foyda va zarar** — foydaning yagona joyi
4. **Qarzlar** (yangi) — debitor (mijozlar nasiyasi, nasiya tashkilotlari) + kreditor (yetkazib beruvchilar)
5. **Kapital**
- ❌ Yetkazib beruvchi to'lovlari (takror, noto'g'ri manba)

### Hisobotlar (12 → 5)
1. **Savdo** `[Umumiy | Tovarlar (ABC) | Do'konlar]`
2. **Ombor** `[Qoldiq | Harakat (sanaga qoldiq) | B/U]`
3. **Mijozlar** `[Tahlil | Segmentlar]`
4. **Xodimlar** (rejalar bilan)
5. **Yetkazib beruvchilar**
- ❌ Moliya, Foyda → Moliya sahifasi. Yuqorida bitta davr tanlagich.

### AI (4 → 3)
1. **Kunlik tahlil** (+ haftalik hisobot)
2. **Yordamchi**
3. **Mijozlar boti** (Instagram suhbatlar va statistika; keyin Telegram)
- ❌ Statistika → Bosh sahifa

### Sozlamalar (yangi — Boshqaruv + Admin + Integratsiyalar o'rniga)
Bo'limlar (chapda ro'yxat yoki akkordeon):
1. **Kompaniya** — nom, logo, login sahifasi, menyu nomlari, yashirin sahifalar
2. **Do'konlar**
3. **Xodimlar va ruxsatlar** `[Xodimlar | Rollar | Qurilmalar]`
4. **Savdo qoidalari** — USD kursi, manbalar, nasiya tashkilotlari, chegirma chegaralari, do'kon/xodim rejalari
5. **Bildirishnomalar** — qaysi hodisalar kimga
6. **AI agentlar**
7. **Integratsiyalar** — Telegram bot, Instagram, Payme/Click/Uzum, UDS, API kalitlar
8. **Audit jurnali** (server)

**Bildirishnomalar** — sahifa emas, yuqori panelda qo'ng'iroqcha (server + real vaqt). Chegirma so'rovini shu yerdan tasdiqlash.

**Yangi menyu:** Bosh sahifa · Sotuv · Ombor · Kirim · Mijozlar · Marketing · Moliya · Hisobotlar · AI · Sozlamalar

---

## 6. Tezlik va kod sifati

### Tezlik
- **Hamma ma'lumotni yuklab hisoblash:** `getSales()` serverdan **barcha sotuvlar tarixini itemlari bilan** qaytaradi (sahifalashsiz) va u 5 sahifada chaqiriladi. Hisobotlar sahifasi ochilganda **11 ta to'liq ro'yxat** yuklanadi. Boshqaruv sahifasi **har tab almashganda** 6 ta ro'yxatni qayta yuklaydi (Sozlamalar tabida ham). Bosh sahifa 5 ta to'liq ro'yxatni faqat "oxirgi 5 sotuv" va "kam qolgan" uchun yuklaydi. Har javob oflayn uchun IndexedDB ga ham yoziladi.
- **Yechim:** eski hisobot tablarini serverga (`reportsController`) ko'chirish; Sotuv tarixi va Mijozlar uchun server sahifalash (pagination) va filtr; Bosh sahifani serverdagi kichik so'rovlarga o'tkazish.
- **Tarjimalar:** o'zbek va rus tili bitta bo'lakda (~426 KB) har sahifada yuklanadi → faol bo'lmagan tilni kerak bo'lganda yuklash (telefonda sezilarli).
- Eng katta bo'laklar: Hisobotlar 431 KB, Sotuv 261 KB, Ombor 233 KB, Boshqaruv 197 KB.

### Kod tuzilmasi
- **"Hamma narsani biluvchi" fayllar:** `Sales/useSalesState.js` (1877 qator, 8 tabning hammasi bitta hook'da — faol bo'lmagan tablar holati ham hisoblanadi), `Management/index.jsx` (1705, har tabga `ctx` orqali ~150 maydon uzatadi), `Income/index.jsx` (1802), `Reports/index.jsx` (1948). Yangi tuzilmada har tab o'z holatini o'zi boshqaradi.
- **Takrorlangan yordamchilar:** `formatPrice` 15 faylda, `Pagination` 15, `fmt` 8, `isPrivileged` 7, `SortIcon` 4 → `src/utils/format.js` + `src/components/ui/`.
- **89 ta jim `catch {}`** — xato foydalanuvchiga ko'rinmaydi (2-bo'limdagi xodim tahriri xatosi shu sababli bilinmagan).
- `MOCK_*` nomlari (mock.js davridan) 21 faylda 428 marta — haqiqiy ma'lumot uchun chalg'ituvchi nom.

### O'lik kod (olib tashlash mumkin)
- `src/config/credentials.js` — **demo parollar** (admin123 va h.k.) git'da; hech qayerda ishlatilmaydi.
- `src/constants/calendar.js`, `src/api/higgsfieldService.js`, backend `controllers/higgsfieldController.js`.
- Boshqaruv → `index.jsx` dagi aksiya (promo) holati va funksiyalari — hech qaysi tab ishlatmaydi.
- Bosh sahifadagi ishlatilmaydigan hisob-kitoblar (bugungi tushum, 7 kunlik grafik, `KpiCard`).
- Eski ruxsat tizimi (`rolePermissions`, `ROLE_PERMISSIONS`, `employees.permissions`), AI mahalliy sozlamalari, "ishonchli qurilmalar", eski sodiqlik o'zgaruvchilari (`silverVisits`, `loyaltyVisitsRequired` — ctx da yuriladi, ishlatilmaydi).
- Tarjimalar: ~800 ta ehtimoliy ishlatilmagan kalit (shundan ~230 tasi eski `ai_*`), rus tilida 130 ta ortiqcha kalit.
- Ruxsat daraxtida `management.shops` bor, lekin Boshqaruvda bunday tab yo'q.

### Backend
- **Migratsiyalar 17 faylga tarqalgan** (`index.js` 48 ta, `marketingDb` 31 ta, controllerlar boshida `ADD COLUMN/CREATE TABLE`). Ular ilova ishga tushganda bitta bazaga qo'llanadi → **multi-tenant (Bosqich 4) uchun to'siq**: har tenant bazasiga qo'llanmaydi. Ikkinchi mijozdan oldin bitta versiyali migratsiya tizimiga yig'ish kerak.
- `aiController.js` 1655 qator (chat + Instagram webhooklar + statistika) → 2–3 faylga bo'lish.
- `index.js` 666 qator (migratsiya + seed + jadval) → ajratish.

---

## 7. Bosqichli reja

| Bosqich | Nima | Hajm | Xodimlarga ta'siri |
|---|---|---|---|
| **0. Xatolar** (birinchi) | 2-bo'lim (server sozlamalari, komplekt, bildirishnomalar + real vaqt chegirma so'rovi, audit, xodim tahriri) + 3-bo'lim 1–3 (server narx/chegirma nazorati, do'kon chegarasi) + o'lik AI sozlamalari | 2–3 sessiya | Deyarli ko'rinmaydi; chegirma so'rovi ishlay boshlaydi |
| **1. Sozlamalar** | Boshqaruv + Admin + Integratsiyalar → bitta Sozlamalar; Tovarlar → Ombor; Sodiqlik/Komplekt → Marketing; bildirishnoma qo'ng'iroqchasi | 1–2 sessiya | Admin/boshqaruvchi uchun yangi joylashuv |
| **2. Ish sahifalari** | Sotuv 8→5, Kirim 7→4, Moliya 7→5, Ombor 6→5, Marketing 6→4, mijoz profili 8→5; `useSalesState` ni tablar bo'yicha bo'lish; yagona kirim formasi | 2–3 sessiya | Sotuvchilar uchun Kassa joylashuvi o'zgaradi — ogohlantirish kerak |
| **3. Hisobotlar** | Eski 7 tab hisobini serverga, yagona foyda formulasi, 12→5 tab, yagona davr tanlagich; Bosh sahifa yengillashtirish; Sotuv tarixi sahifalash | 3–4 sessiya | Raqamlar hamma joyda bir xil bo'ladi |
| **4. Tozalash** | O'lik kod, `MOCK_` nomlar, tarjima kalitlari, umumiy yordamchilar, til bo'lagini ajratish, jim `catch` lar, backend migratsiyalarini yig'ish, `aiController` bo'lish | 1–2 sessiya | Ko'rinmaydi |

Har bosqichdan keyin: `npm run build`, lokal sinov, commit. Deploy — faqat siz aytganda.

---

## 8. Siz qaror qilishingiz kerak bo'lgan savollar

1. **Boshqaruv + Admin + Integratsiyalar → bitta "Sozlamalar" sahifasi** — rozimisiz? *(Tavsiya: ha.)*
2. **Kirim formasi qayerda bo'lsin?** (a) Faqat Kirim sahifasida, omborchiga "Kirim" ruxsati moliyaviy ma'lumotsiz beriladi; (b) Ombor → Kirim ham qoladi, lekin ikkala joy bitta umumiy formani ishlatadi. *(Tavsiya: b — omborchi odatiga tegmaydi.)*
3. **Hisobotlar → Moliya va Foyda tablarini Moliya sahifasiga ko'chiramizmi**, Sotuv → Foyda tabini olib tashlaymizmi? *(Tavsiya: ha — foyda bitta joyda, bitta formulada.)*
4. **Boshqaruvchi xodimlarni tahrirlay oladimi?** (a) Ha — serverda ruxsat beriladi (o'chirish faqat admin tasdig'i bilan); (b) Yo'q — faqat admin, boshqaruvchi faqat ko'radi. *(Hozir oraliq holat: ko'rinadi, lekin saqlanmaydi.)*
5. **Chegirma so'rovi:** real vaqtda boshqaruvchi telefoniga borib, u yerdan tasdiqlansinmi? Yoki qo'shimcha "boshqaruvchi PIN kodi" (sotuvchi telefonida kiritiladi) ham kerakmi?
6. **Server narx nazorati:** minimal narxdan past sotuv serverda butunlay taqiqlansinmi yoki faqat tasdiqlangan chegirma so'rovi bilan ruxsat berilsinmi?
7. **AI → Statistika → Bosh sahifaga** ko'chirilsinmi? Sotuvchi AI sahifasini (butun biznes tushumini) ko'rishi kerakmi?
8. **Komplekt → Marketing → Aksiyalar** ichiga yangi tur sifatida qo'shilsinmi (alohida tab o'rniga)? *(Tavsiya: ha — aksiya mexanizmi serverda tayyor, kassa uni allaqachon hisoblaydi.)*
9. **Qachon boshlaymiz?** Bosqich 0 ni hozir (test oyi davomida) qilib, ko'rinishni o'zgartiruvchi bosqichlarni test oyidan keyin qilishmi? *(Tavsiya: ha.)*

---

## 9. Tekshirilmagan narsalar

- Server bazasidagi yozuvlar soni (sotuvlar, itemlar) — avtomatik rejim server bazasiga ulanishga ruxsat bermadi. Tezlik bahosi kod asosida, real hajm bilan emas.
- Ilova brauzerda bosib ko'rilmadi — tahlil kodni o'qish asosida. 2-bo'limdagi xatolar kod orqali aniq tasdiqlangan (saqlash joyi va server route'lari tekshirildi).
