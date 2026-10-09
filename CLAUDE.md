# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Vite, localhost:5173)
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

No test suite. No linter.

## Ishlash uslubi (Working Style — har sessiyada o'qi)

### Umumiy qoidalar
- Foydalanuvchi o'zbek tilida yozadi → javob **o'zbek tilida** bo'lsin
- Qisqa va aniq javob ber — keraksiz tushuntirish yo'q
- Foydalanuvchi ruxsat bermagan narsani o'zgartirma
- Xato chiqsa — o'zing tekshir, tuzat, build qil, commit qil — foydalanuvchiga faqat natija ayt

### Refactoring ishlash tartibi
Katta faylni bo'lishdan oldin **majburiy qadamlar**:
1. `npm run build` — avval xatosiz build bo'lishiga ishonch hosil qil
2. Python script yoz (`open(..., encoding='utf-8')`) — fayllarni bo'l
3. Har bir bo'lingan faylda importlarni tekshir:
   - React hooks (`useState`, `useEffect`, `useMemo`...) to'liqmi?
   - `lucide-react` ikonlar to'liqmi?
   - `src/api/*Service.js` importlari to'liqmi?
   - `export default ComponentName` bormi?
4. `npm run build` — xato yo'qligini tasdiqlа
5. `git add` + `git commit`

### Xato chiqqanda
- Xatoni o'zing o'qi, o'zing tuzat — foydalanuvchidan so'rama
- Bir xil xato (import yo'q) qayta chiqmasligi uchun **barcha** fayllarni skan qil, nafaqat xatolikni
- Birma-bir emas — barcha yetishmayotgan importlarni topib, bir marta tuzat

### Git qoidalari
- Har bir tuzatishdan keyin `git add` + `git commit` — sessiya oxirida emas, darhol
- Commit message o'zbek tilida yoki inglizcha (aralash ham bo'ladi)
- `git reset`, `git stash pop` kabi destructive operatsiyalardan oldin foydalanuvchidan so'ra

### Build tekshirish
- Har qanday o'zgarishdan keyin `npm run build` majburiy
- Build xato bersa — keyingi ishga o'tma, avval tuzat

---

## JORIY HOLAT VA KEYINGI ISHLAR (har sessiyada BIRINCHI o'qi — yangilangan: 2026-10-08)

**Holat:** server = 25-deploy (2026-10-09), **lokal va server bir xil** — katta qayta tuzish deploy qilindi: yagona Sozlamalar, server sozlamalari/bildirishnomalar/audit, yangi UI (to'q ko'k, diagrammalar, har sahifada asosiy ko'rinish + bo'limlar modalda), yangi Foyda, Qarzlar, touch numpad, **Ulgurji savdo** (`/wholesale`, backend `/api/wholesale`, do'kon turi `shops.kind`), **Ishlab chiqarish** (`/production`, backend `/api/production`, miqdor bo'yicha qoldiq `stock_lots`; menyuda faqat sex/ulgurji ombor bo'lsa). **kg tovar sotish** (kassa + ulgurji, `utils/bulkSale.js`), **hisobotlar serverda** (`analyticsController`, `/api/reports/*-overview`; eski klient hisobotlari faqat "Eski batafsil ko'rinish" tugmasida). Reja va bajarilganlar: `docs/TAHLIL_VA_REJA_2026-10-08.md` (15–16-bo'limlar). Ilova real sinovda (test oyi): server DB — haqiqiy ma'lumot.
BILLZ paritet bo'limlarining hammasi ✅, AI qayta qurildi ✅ (3 ta AI — "AI agentlar arxitekturasi" bo'limi).

**Foydalanuvchidan kutilmoqda (o'zing boshlama, u aytganda tekshir):**
- [ ] **FaceID xodim sinovi** — xodim tizimga qayta kirgach "kirdi" deydi → serverda `select user_type, count(*) from refresh_tokens group by 1` (`employee` qatori paydo bo'lishi kerak; 2026-10-08 da faqat `user` = admin bor edi).
- [ ] **Instagram botni qayta yoqish** — yangi Meta token (eskisi 2026-10-04 tugagan) → Admin → AI Agentlar → Mijozlar boti → Instagram ulanishi + Kanallar (komment/DM hozir aniq "o'chiq"). Yoqilgach haqiqiy Instagram bilan sinov (webhook → javob → Graph API).
- [ ] **Telegram bot token** — Mijozlar botining Telegram kanali shu bilan ulanadi (`botPrompts.BOT_CHANNELS.telegram` tayyor; webhook/ulash kodi YO'Q).
- [ ] **Mijozlar boti modeli** — Sonnet 5.5 qo'yilgan (foydalanuvchi: "qimmat bo'lsa qaytaraman"); bot yoqilgach xarajatni kuzat, kerak bo'lsa Haiku.
- [ ] **Showroom ish vaqti** — bot bilimlar bazasida "kuz-qish mavsumida 24 soat"; bahorda o'zgarishi mumkin (Admin → Mijozlar boti → Bilimlar bazasi).

**Foydalanuvchi bergan keyingi ishlar (2026-10-09 — yangi sessiya boshida AYT, qaysidan boshlashni so'ra):**
1. [ ] Obuna bo'limi — oylik to'lov dastur ichidan (Click, Payme, Uzcard/Humo)
2. [ ] Mobil va kompyuter ilovalari (hozir faqat Chrome yorlig'i / PWA)
3. [ ] Kod sifati va xavfsizlik auditi
4. [ ] Ulgurji savdo uchun bot

**Navbatdagi ishlar (tartib bilan):**
1. [ ] Telegram kanali — token kelganda.
2. [ ] **~2026-10-21: eski login yo'lini yopish** — `authController` da `flow` yo'q login → 7 kunlik token beradi (FaceID'ni chetlab o'tadigan oxirgi yo'l). Avval hamma xodim yangi yo'lga o'tganini `refresh_tokens` orqali tekshir.
3. [ ] Multi-tenant — ikkinchi mijoz paydo bo'lganda ("Domen" bo'limi). Shunda AI kaliti har tenantga alohida (hozir chat `settingsStore.aiApiKey` ni yubora oladi, kundalik tahlilchi faqat `.env ANTHROPIC_API_KEY`).
4. [ ] Instagram token avto-yangilash (graph.instagram.com/refresh_access_token, haftalik) + muddat yaqinlashsa adminga ogohlantirish — bot qayta yoqilganda taklif qil.

**Keyinga qoldirilgan (foydalanuvchi qarori 2026-10-09 — o'zing boshlama, u aytganda qil):**
- [ ] **Fiskal chek** — tayyorlov tayyor (Sozlamalar → Integratsiyalar → Fiskal chek, `utils/fiscal.js` navbat); provayder tanlanib adapter yoziladi (`ADAPTERS`).
- [ ] **Ikkinchi mijoz (multi-tenant)** — domen/SSL/tenant routing ("Domen" bo'limi).

✅ Sotuvchi xarajat/kapitalni ko'rmaydi (2026-10-09): `GET /api/expenses`, `/api/capital` `requirePerm`, AI toollari `TOOL_PERMS` (aiController), yetkazib beruvchi qarzi AI bo'limlarida sezgir.

---

## Working Agreement (read every session)

We work page by page. The user describes what needs to be done; Claude does it or says it's already done.

**Rules:**
1. Data lives in the backend (PostgreSQL) — frontend reads/writes via `src/api/*Service.js` (axios `client.js`). `mock.js` NO LONGER EXISTS (eski eslatmalardagi `MOCK_*` nomlari — tarixiy).
2. Pages update via local `useState` + `useDataStore().bump()` — never reload the page
3. When connecting a card/modal from one page to another, use `bump()` so the target page receives data automatically
4. Do not add features beyond what is explicitly requested
5. Do not add comments unless the WHY is non-obvious
6. Lokalda ishla, test qil, commit qil — serverga deploy FAQAT foydalanuvchi "deploy" deganda

## Architecture Overview

**Shina CRM (SICRM)** — React SPA (PWA) + backend `C:\Users\Umidjon\Desktop\shina_crm_backend` (Node.js + Express + PostgreSQL). Server: Hetzner `167.233.169.118`, `gt.sicrm.uz` (ilova), `sicrm.uz` (API).

### Data Layer

1. **Backend API** — `src/api/*Service.js` (masalan `salesService`, `productService`, `reportService`, `aiStatsService`), umumiy axios `src/api/client.js` (token, `x-lang`), tokenni jimgina yangilash `src/api/session.js` (access 15 daqiqa + refresh 7 kun). Server tomonda hisob-kitob (hisobotlar, AI) — `reportsController`, `utils/aiSections` va h.k.

2. **Zustand stores** (`persist` → `localStorage`):
   - `authStore` — session, device approval, `hasPermission` (rollar daraxti serverdan, `utils/rolesSync.js`)
   - `settingsStore` — USD rate, employees (serverdan cache), installment orgs, discount rules, notification toggles, `aiApiKey` (`goodtires-settings`)
   - `shopStore` — branch list, selected shop (`goodtires-shop-store`) — **global do'kon tanlovi** (sidebar), sahifalar shu `selectedShopId` ga bog'lanadi
   - `cartStore` — active POS cart (`goodtires-cart`)
   - `notificationStore` — in-app notifications with read/unread (`goodtires-notifications`)
   - `aiStore` — AI chat tarixi (`chatKey` bo'yicha), `marketingStore` — marketing yo'l xaritasi
   - `dataStore` — global `version` counter + `bump()` for cross-page reactivity (not persisted)
   - `themeStore` / `langStore` — UI preferences

### Cross-Page Reactivity Pattern

`src/store/dataStore.js` holds a single `version` counter. Pages subscribe via `useEffect([version])` to re-fetch when any mutation happens elsewhere.

```js
// After any mock array mutation:
const { bump } = useDataStore()
bump()  // all subscribed pages re-fetch

// In pages that need to stay in sync:
const { version } = useDataStore()
useEffect(() => { loadData() }, [version])
```

**Where `bump()` is already called:** sotuv, bekor qilish, qaytarish, kirim, to'lovlar, mijoz CRUD, tovar narxi/o'chirish, barkod amallari. Real vaqt hodisalari (SSE) ham kerakli joyda `bump()`/sync chaqiradi.

### Inventory Model (3-level hierarchy)

```
products → batches → items          (DB jadvallari)
 (tovar)   (kirim partiyasi) (bitta dona, barkod bilan)
```

- **product**: `cash_price`, `min_sale_price`, `installment_base_price`, `category` (`tire`|`wheel`|`accessory`), `low_stock_threshold`
- **batch**: supplier, `quantity_in`, `purchase_price(_usd)`, `entry_usd_rate`, `has_missing_price`, `unit`, `shop_id`, qarz (`debt_usd`, `due_date`)
- **item**: bitta dona. `barcode` bo'sh = sotib bo'lmaydi. `status` (`in_stock`/`sold`/...), `shop_id` (transferdan keyin partiya do'konidan farq qilishi mumkin — do'kon bo'yicha qoldiqni `items.shop_id` dan hisobla)
- B/U: `used_stock`, `used_sales`, `used_sale_items` (alohida oqim)

### Auth & Permissions

Login (yangi ilova, `flow: 2`): parol → vaqtinchalik `pre` token → selfie → `POST /api/auth/verify-face` (yuz serverda solishtiriladi) → to'liq sessiya yoki admin tasdig'i (kutish sahifasi, SSE `device_status`). Admin — cheksiz qurilma; xodim — bitta qurilma (yangisi tasdiqlansa eskilari bekor, SSE `device_revoked`).

Ruxsatlar: rollar va ruxsat daraxti serverda (app_settings `roles`), xodimga individual `employees.access`. Frontend `hasPermission('<sahifa>.<tab>')`, backend yozish route'larida `requirePerm(...)`, foyda/tannarx `canSeeProfit`/`canSeeCost`.

### Routing & Layout

- `AuthLayout` — `/login`, `/pending-approval`
- `MainLayout` — all protected routes; sidebar with permission-filtered nav, offline badge, lang/theme toggles

React Router v6 — pages **unmount on navigation** (no caching), so re-mounting always re-fetches from the API.

### Deployment & Tijoratlashtirish Yo'l Xaritasi (qoida — har doim eslab qolinsin)

Bu bo'lim foydalanuvchi bilan PWA/SaaS strategiyasi haqida bo'lib o'tgan suhbat xulosasi. Loyiha shu yo'naltiruvchi reja asosida rivojlantiriladi — kelajakda tegishli bosqichga yetganda shu yerdan eslab, mos qadamlarni taklif qilish kerak.

**Bosqich 1 — Frontend + backend ✅ (2026-10)** — backend yozildi, server ishlayapti, BILLZ paritet bo'limlari tugadi, real sinov (test oyi) davom etmoqda.

**Bosqich 2 — PWA qilib chiqarish ✅ BAJARILDI (2026-06-07)**
- `vite-plugin-pwa` o'rnatildi, `vite.config.js` ga `VitePWA` konfiguratsiyasi qo'shildi (manifest, service worker, ikonlar, runtime caching). `public/icons/` da 192/512/maskable PNG ikonlar yaratildi (PIL bilan, "GT" + accent-red brand rang). `index.html` ga manifest link, theme-color, apple-mobile-web-app meta teglar qo'shildi. `npm run build` muvaffaqiyatli — `dist/` da `manifest.webmanifest`, `sw.js`, `registerSW.js` generatsiya qilinadi. Endi loyiha brauzerda "O'rnatish"/"Bosh ekranga qo'shish" orqali App sifatida o'rnatiladi.
- Sabab (o'sha paytda): arxitektura PWA bilan to'liq mos edi; backend qo'shilgandan keyin ham PWA ishlaydi (offline navbat — `offlineQueue`).
- **Termal printer cheklovi**: brauzer/PWA xom (raw) TCP socket ocholmaydi → WiFi termal printerlarga ESC/POS orqali to'g'ridan-to'g'ri chop etish PWA ichidan ishlamaydi. Shu funksiya kerak bo'lganda loyiha **Capacitor** bilan native qobiqqa o'raladi (faqat shu qism uchun maxsus plagin qo'shiladi, qolgan kod o'zgarmaydi). Bluetooth printerlar uchun Web Bluetooth API variant bo'lishi mumkin, WiFi uchun emas. Hozirgi barcode generatsiya/print (`window.print()`) va kamera orqali skanerlash — PWA bilan muammosiz ishlaydi, o'zgartirish shart emas.

**Bosqich 3 — Tijoratlashtirish: "alohida nusxalar" (white-label) modeli**
- Har bir tadbirkor (jiyan, shogird, boshqa mijoz) uchun alohida sozlangan build (o'z `companyName`/`companyLogo`/narxlari bilan) tayyorlanadi — `Konfiguratsiya` va `Sozlamalar` bloklari shu uchun ishlatiladi.
- Hosting: bitta hosting hisobida (Vercel/Netlify/Cloudflare Pages yoki bitta VPS + Nginx) bir nechta loyihani joylashtirish va har biriga alohida domen/subdomen ulash mumkin — har biriga alohida hosting sotib olish shart emas.
- Domen: bitta asosiy domen sotib olib, har bir mijoz uchun subdomain (`mijoz1.brend.uz`, `mijoz2.brend.uz`) ochish — eng tejamkor yo'l.
- **Ma'lumotlar izolyatsiyasi**: endi backend bor — har tenant uchun alohida PostgreSQL bazasi (`/root/create_tenant.sh`, "Domen" bo'limi). Ma'lumotlar aralashmaydi.
- [ ] **AI Agent obunasi** (multi-tenant bilan qilinadi): AI xizmati API kalitiga bog'liq va to'lov kalit egasidan yechiladi. Bitta umumiy kalitni barcha nusxalarga qo'yish — boshqalarning xarajati sizning hisobingizdan ketishiga olib keladi. Yechim: AI Agent sahifasiga/Sozlamalarga "API kalit kiritish" maydoni qo'shilishi kerak — har bir mijoz o'z kalitini kiritadi va o'zi to'laydi. Agar mijoz AI'ni xohlamasa — `hiddenPages` orqali shu bo'lim yashiriladi (bu funksiya allaqachon mavjud).

**Bosqich 3.5 — Backend xavfsizlik yaxshilanishlari (SaaS DAN OLDIN bajarilishi kerak)**

**✅ 1–3 BAJARILDI (2026-10-05):** login (`flow: 2`) faqat vaqtinchalik `pre` token beradi (12 soat; oddiy API → 403 `FACE_REQUIRED`); `POST /api/auth/verify-face` yuzni serverda saqlangan shablon bilan solishtiradi (`utils/faceCrypto.js`, Evklid < 0.5) → to'liq sessiya yoki admin tasdig'i; `POST /api/auth/session` (kutish sahifasi) faqat shu login davomida admin tasdiqlagan bo'lsa; `access` token 15 daqiqa (`TOKEN_EXPIRED` → frontend `src/api/session.js` jimgina yangilaydi), `refresh` 7 kun — `refresh_tokens` jadvalida hash, har yangilashda almashadi, qayta ishlatilsa shu qurilma sessiyalari bekor; qurilma bekor/xodim o'chirilsa/parol o'zgarsa refresh bekor. Selfie va descriptorlar AES-256-GCM (`.env FACE_ENC_KEY`, 64 hex — YO'QOTMA, aks holda selfie/shablonlar o'qilmaydi) bilan shifrlanadi. Eski ilova (flow yo'q) va eski 7 kunlik tokenlar o'tish davrida ishlaydi. 4-band (multi-device) qurilma tasdiqlash + real vaqt bilan qoplangan.

Bandlar (hammasi ✅):
1. ✅ `selfie` va `descriptor` bazada AES-256-GCM bilan shifrlangan (`utils/faceCrypto.js`).
2. ✅ `faceMatch` serverda tekshiriladi (`/api/auth/verify-face`, Evklid < 0.5).
3. ✅ Access 15 daqiqa + refresh 7 kun (`refresh_tokens`, almashuv, qayta ishlatilsa bekor).
4. ✅ Bitta qurilma nazorati — qurilma tasdiqlash + SSE `device_revoked`. Qolgan yagona yo'l: eski `flow`siz login (~2026-10-21 da yopiladi, "Navbatdagi ishlar").

**Bosqich 4 — SaaS (multi-tenant) ga o'tish — [ ] ikkinchi mijoz paydo bo'lganda**
- ✅ Backend + PostgreSQL yozilgan, frontend API bilan ishlaydi. Qolgani: tenant routing (subdomen → alohida DB), obuna/to'lov.
- Multi-tenant izolyatsiya: har bir yozuvga `tenantId`/`businessId` qo'yiladi, har bir foydalanuvchi faqat o'ziga tegishli ma'lumotni ko'radi. Bitta domen, turli login/parollar.
- Obuna (subscription) va to'lov tizimi (Click/Payme) integratsiyasi shu bosqichda qo'shiladi.
- Oylik infratuzilma narxi (server+baza+email+backup) — kichik miqyosda taxminan $15-60/oy atrofida.

**✅ BAJARILDI (2026-10-05) — SSE orqali real vaqt.** Backend `src/realtime.js` (`GET /api/realtime/stream`, authMiddlewareNoDeviceCheck; `toUser/toDevice/toAdmins/toAll/toNonAdmins`), frontend `src/hooks/useRealtime.js` (fetch oqimi, token sarlavhada, avtomatik qayta ulanish) — MainLayout va PendingApproval'da. Hodisalar: `perm_changed` (xodim yangilandi / rollar daraxti saqlandi → syncRolesFromServer), `device_revoked` (bekor qilindi yoki boshqa qurilma tasdiqlandi → logout + Login'da sabab), `account_disabled`, `device_status` (kutish sahifasi darhol), `login_attempt`/`attempts_changed` (admin bildirishnoma + Qurilmalar tabi yangilanadi). WebSocket emas — nginx Upgrade sozlamasi shart emas. Yangi xavfsizlik hodisasi qo'shilsa shu `rt.*` funksiyalaridan foydalan. Quyidagi matn — tarixiy reja.

**✅ Bitta qurilma talabi (so'ralgan 2026-06-07)** — bajarildi: xodim yangi qurilmasi tasdiqlansa eski qurilmalari bekor qilinadi va SSE orqali darhol chiqariladi; Admin uchun cheklov yo'q.

### Offline Support

`src/utils/offlineQueue.js` — IndexedDB queue (`shina_crm_offline`). `enqueueAction({ type, payload })` adds items; `syncQueue(apiHandler)` processes them. `useOfflineSync` hook in `MainLayout` auto-syncs on reconnect and shows badge.

### UI Conventions

- Colors: CSS custom properties via Tailwind aliases — `bg-bg-primary`, `text-accent-red`, `border-border`, etc. Dark/light/brand themes toggle `data-theme` attribute on `<html>`.
- Brand color: `accent-red` = `#E63946`
- Pages: tab-based layout (`TABS` array + `activeTab` useState)
- Animations: Framer Motion (`motion.div`, `AnimatePresence`)
- Icons: `lucide-react`
- Price format: `n?.toLocaleString('uz-UZ') + " so'm"`

### i18n

Locales `uz` (default) and `ru` at `src/i18n/uz.js` and `src/i18n/ru.js`. Use `const { t } = useTranslation()`. Active locale in `localStorage` key `shina_lang` via `langStore`.

---

## Session Notes (tarixiy eslatmalar; `MOCK_*` nomlari — eski frontend davri)

### Hook xatosi haqida
`.claude/settings.local.json` da `"cockroachdb": false` yozilgan. Yangi sessionda CockroachDB plugin hook xatosi chiqmasligi kerak.

### Sales.jsx — Tabs holati

| Tab | Holati |
|-----|--------|
| `new_sale` | ✅ Tayyor |
| `history` | ✅ Tayyor |
| `returns` | ✅ Tayyor |
| `returns_history` | ✅ Tayyor |
| `installment` | ✅ Tayyor (search, inline to'lov modal, mijoz to'lov modal, org to'lov) |
| `profit` | ✅ Tayyor (search, margin%, komissiya ayirish) |

### Customers.jsx — Tayyor xususiyatlar
- Mijoz qo'shish / tahrirlash / o'chirish
- `phone2` — jadval, profil, forma, qidiruvda ham ishlatiladi
- Merge modal (GitMerge tugmasi) — manual birlashtirish
- Phone collision detection (qo'shish/tahrirlashda)
- `mergeCustomers()` funksiyasi `mock.js` da
- ID collision bug to'g'rilandi (`reduce` bilan max ID)
- Bekor tarixi `customerName` to'g'rilandi (`originalSale` dan o'qish)
- Installment to'lov + payment history (Customers modal ichida)
- **Qarz kolonnasi** — asosiy jadvalda nasiya qarzi ko'rinadi
- **phone2 qidiruv** — search phone2 ni ham qamrab oladi
- **birthDate / instagram** — profil modalining "Umumiy" tabida
- **Pagination** — 20 ta / sahifa, search/filter o'zgarganda reset

### mock.js — Muhim funksiyalar (TARIXIY — fayl o'chirilgan, mantiq backendda)
- `mergeCustomers(keepId, removeId)` — mijozlarni birlashtiradi, salesni ko'chiradi
- `addCustomer` — ID: `reduce` max + 1 (collision yo'q)

### Expenses.jsx — Tayyor xususiyatlar
- Do'kon xarajatlari tab: CRUD, oy filtri, kategoriya breakdown, qidiruv, valyuta filtri, pagination
- Yetkazib beruvchi to'lovlari tab: readonly (Income dan), pagination, do'kon filtri, qidiruv, supplierName MOCK_SUPPLIERS dan o'qiladi
- Kapital harakati tab: CRUD, oy filtri, pagination

### ✅ Multido'kon — global do'kon filtri (bajarildi)
Do'kon tanlovi sidebar'da (`shopStore.selectedShopId`), sahifalardagi alohida `filterShop` olib tashlangan. Quyidagi matn — tarixiy reja.
Multido'kon qo'shilganda **do'kon va qidiruv filtri sahifaning eng tepasiga** (global header ga) ko'chirilsin.
Shunda tepada tanlangan do'kon pastdagi **barcha tablar va maydonlarga** bir vaqtda ta'sir qilsin.
Tegishli fayllar: `Expenses.jsx` (ShopExpensesTab, SupplierPaymentsTab, CapitalTabWithHeader), `shopStore.js`.

### Refactoring holati (2026-06-21 da yangilandi)

Barcha katta sahifalar kichik fayllarga bo'lindi (folder-as-component pattern). Quyidagilar **tugallangan**:

| Sahifa | Holat | Tuzilma |
|--------|-------|---------|
| `Sales.jsx` | ✅ Bo'lindi | `src/pages/Sales/index.jsx` + `tabs/` + `useSalesState.js` + `src/components/sales/` |
| `AIAgent.jsx` | ✅ Bo'lindi | `src/pages/AIAgent/index.jsx` + `tabs/` |
| `Warehouse.jsx` | ✅ Bo'lindi | `src/pages/Warehouse/index.jsx` + `tabs/` + `components/` + `whHelpers.jsx` |
| `AdminPanel.jsx` | ✅ Bo'lindi | `src/pages/AdminPanel/index.jsx` + `tabs/` + `components/` + `apHelpers.jsx` |
| `Reports.jsx` | ✅ Bo'lindi | `src/pages/Reports/index.jsx` + `tabs/` + `components/shared.jsx` |
| `Management.jsx` | ✅ Bo'lindi | `src/pages/Management/index.jsx` + `tabs/` + `components/mgmtHelpers.jsx` |
| `Income.jsx` | ✅ Bo'lindi | `src/pages/Income/index.jsx` + `tabs/` + `components/incHelpers.jsx` |
| `Expenses.jsx` | ✅ Bo'lindi | `src/pages/Expenses/index.jsx` + `tabs/` + `components/` |

Barcha katta sahifalar bo'lindi. Hali bo'linmagan fayl yo'q.

### Refactoring qoidalari (MUHIM — unutma)

1. **Helper fayllar `.jsx` bo'lishi SHART** — JSX ishlatsa `.js` emas `.jsx` extension (Vite xato beradi)
2. **Har bir fayl `export default ComponentName` bilan tugashi SHART**
3. **Python script bilan bo'lish** — `open(..., encoding='utf-8')` — PowerShell Unicode muammosi bor
4. **Bo'lgandan keyin ALBATTA tekshir**: har bir split fayl o'z importlarini to'liq o'z ichida olib yurishi kerak — hook, icon, api service funksiyalari barchasi
5. **Folder pattern**: `src/pages/PageName/index.jsx` (main) + `tabs/TabName.jsx` + `components/ModalName.jsx` + `helpers.jsx`
6. **Props pattern**: Warehouse kabi sahifalar named props oladi; Sales `{ ctx }` pattern ishlatadi

### Multido'kon va qo'shimcha ishlar holati (2026-06-21)

Quyidagilar **stash dan qaytarildi va ishlaydi**:
- `src/store/shopStore.js` — do'kon ro'yxati, `selectedShop`
- `src/store/authStore.js` — `hasPermission` `roleAccessTrees`/`roleDeniedNodes` bilan
- `src/store/settingsStore.js` — AI API sozlamalari (`aiApiKey`, `aiApiProvider`, `aiModel`)
- `src/store/aiStore.js` — AI agent store
- `src/layouts/MainLayout.jsx` — shop selector UI
- `src/components/ShopPickerModal.jsx` — do'kon tanlash modal
- `src/pages/AdminPanel/tabs/ShopsTab.jsx` — do'konlar tab (Admin panelda)
- `src/pages/Management/` — `shopId` bilan multishop (bo'lindi)
- `src/components/sales/` — 5 ta komponent (BarcodeScanner, DiscountRequestModal, ProductSearch, SaleItemSearch, SuccessModal)
- `src/i18n/uz.js` va `src/i18n/ru.js` — yangi tarjima kalitlari

### Sessiya 2026-08-15/16 — Komplekt/Bundle sotuv ko'rinishi (BAJARILDI)

| Fayl | Nima tuzatildi |
|------|----------------|
| `Reports/tabs/SalesTab.jsx` | Bundle chegirma foiz/summa, bekor qilingan sotuvlarda haqiqiy refund summa (MOCK_RETURNS) |
| `Reports/tabs/EmployeesTab.jsx` | Chegirma nazorati: komplekt sotuvlar ham hisobga olinadi |
| `Reports/tabs/ProfitTab.jsx` | Kategoriya "Komplekt" badge, bundle chegirma |
| `Reports/tabs/CustomersTab.jsx` | Mijoz profilida bundle chegirma va tejab qolgan summa |
| `Reports/tabs/FinanceTab.jsx` | Nasiya sotuvlarda "Komplekt" kategoriya |
| `Reports/index.jsx` | employeeStats + customerStats useMemo da komplekt |
| `Sales/tabs/ReturnsTab.jsx` | Bekor qilish kartasida komplekt chegirma |

**Texnik eslatma:** `cancelModal` da backend barcha return larni `cancelled` qilib qo'yadi → MOCK_RETURNS.refundAmount ni original sale bilan join qilib haqiqiy summa ko'rsatiladi.

### O'lchov birligi tizimi (2026-08-14 da qo'shildi)

- `src/components/UnitInput.jsx` — select + "Boshqa..." combo, X tugma bilan tozalash
- `UNIT_OPTIONS = ['dona', 'metr', 'litr', 'kg', 'gramm', 'juft', 'ta']` — predefined, + erkin matn
- **Batch darajasida** (product emas) — har do'kon o'zinikini tanlaydi kirim vaqtida
- DB: `batches.unit VARCHAR(20) DEFAULT 'dona'` — ✅ lokal va serverda bor
- Ko'rinish joylari: BatchesTab, StockTab, ProductModal, BarcodeTab, ProductSearch, Management, Reports, Dashboard
- **UX qoidasi**: forma ochilganda bo'sh (`— tanlang —`), majburiy, modal yopilsa/ochilsa reset

### ProductSearch — Search natijasi qolishi (2026-08-14)
- `handleAdd` dan `setQuery('')` va `setResults([])` olib tashlandi
- Savat `+/-` tugmalari attribute filtrsiz ishlaydi (Option 1 — foydalanuvchi tasdiqladi)

### B/U Sotuv tab — Attribute filtrlar (2026-08-14)
- `buAttrFilters` state, `activeBuAttrFilters` computed — `useSalesState.js` da
- Filter UI `UsedSaleTab.jsx` ga qo'shildi
- `buAvailableGroups` filterlash logikasi yangilandi

### DateMaskInput — Barcha sana maydonlari (2026-06-30 da qo'shildi)
- `src/components/DateMaskInput.jsx` — `kk.oo.yyyy` mask, ISO `yyyy-mm-dd` qaytaradi
- Backspace nuqtani o'chirganda oldidagi raqamni ham olib tashlaydi
- Barcha `type="date"` inputlar shu komponent bilan almashtirildi (11 ta fayl)

---

## Backend holati (yangilangan: 2026-10-08)

### Backend nima?
`C:\Users\Umidjon\Desktop\shina_crm_backend` — Node.js + Express + PostgreSQL.
Frontend `src/api/client.js` orqali ulanadi (`VITE_API_URL`: `.env.production` → `https://sicrm.uz`; lokal sinovda `--mode development`). Express app `src/app.js`, ishga tushirish/migratsiya/seed/jadval `src/index.js`.

### Backend tuzilmasi
```
src/
  controllers/   — auth, sales, reports, finance, marketing, supplierOps, ai, aiStats, aiAgents, ...
  routes/        — har controller uchun router (app.js da /api/... ga ulanadi)
  middleware/    — auth.js (authMiddleware, adminOnly, adminOrManager, authMiddlewareNoDeviceCheck), perm.js (requirePerm, canSeeProfit), errorI18n.js
  agents/        — prompts.js (AI yordamchi/tahlilchi qoidalari), botPrompts.js (Mijozlar boti), dailyAnalyst.js (kundalik tahlil + jadval)
  utils/         — aiSections.js (bo'lim SQL), aiStats.js, aiStatsTools.js, localTime.js, tokens.js, faceCrypto.js, loyalty.js, ...
  realtime.js    — SSE (rt.toUser/toAdmins/...)
  db.js          — pool (PostgreSQL)
  app.js / index.js
tests/
  setup.js       — Jest env vars (JWT_SECRET, TEST_USER, TEST_PASS)
  auth.test.js   — login/auth testlar
  adminOnly.test.js
```

### Muhim backend endpointlar
| Endpoint | Izoh |
|----------|------|
| `POST /api/auth/login` | Login (`flow: 2` → `pre` token; flow'siz — eski yo'l, ~2026-10-21 yopiladi) |
| `POST /api/auth/verify-face` | Yuzni serverda tekshirish → sessiya yoki admin tasdig'i |
| `POST /api/auth/refresh` | Access tokenni yangilash (refresh almashadi) |
| `GET /api/realtime/stream` | SSE hodisalar (perm_changed, device_revoked, weekly_report, ...) |
| `GET /api/ai-stats/section/:section` | AI bo'lim KPI/ro'yxatlari + so'nggi AI xulosa (sales/inventory/customers/marketing/staff/instagram) |
| `GET /api/ai-stats/digests`, `POST .../digests/run` | Kundalik tahlil natijalari / qo'lda ishga tushirish (admin) |
| `POST /api/ai/chat` | AI yordamchi chati (SSE stream) |
| `POST /api/ai/instagram`, `/api/ai/instagram-dm` | Mijozlar boti webhooklari (Cloudflare Worker orqali) |
| `POST /api/auth/attempts` | Selfie yuborish (pending qurilma) |
| `GET /api/auth/attempts/my-status` | Qurilma tasdiqlash statusini so'rash |
| `GET /api/auth/descriptor` | Foydalanuvchining yuz descriptori |
| `PATCH /api/auth/attempts/:deviceId/approve` | Admin qurilmani tasdiqlaydi |
| `PATCH /api/auth/attempts/:deviceId/revoke` | Admin qurilmani bekor qiladi |
| `PUT /api/auth/me` | Admin o'z profilini yangilaydi (users jadvali) |
| `GET /api/employees` | Xodimlar ro'yxati |
| `PUT /api/employees/:id` | Xodim ma'lumotlarini yangilash |
| `POST /api/shops/:id/transfer-and-delete` | Do'konni o'chirish (ma'lumotlarni boshqasiga o'tkazib) |

### Qurilma/Login tizimi (MUHIM — bu shunday ishlashi KERAK)
1. **Admin** — cheksiz qurilmadan kirishi mumkin, device check bypass
2. **Boshqaruvchi/Xodim** — faqat bitta qurilma:
   - Yangi qurilmadan kirmoqchi → selfie → Admin tasdiqlaydi
   - Admin tasdiqlaganda: o'sha foydalanuvchining **boshqa barcha approved qurilmalari avtomatik revoke** bo'ladi
   - Revoke bo'lgan qurilmalardan kirishga urinishda → 403 qaytaradi

### Do'kon o'chirish logikasi
- Do'konda ma'lumot yo'q → to'g'ridan to'g'ri o'chirish
- Do'konda ma'lumot bor (FK constraint 23503) → `{ error: 'SHOP_HAS_DATA' }` qaytaradi
- Frontend: agar boshqa do'kon bo'lsa → transfer modal, bo'lmasa → xato xabar
- Transfer API: `POST /api/shops/:id/transfer-and-delete` — batches, items, sales, expenses, used_stock ko'chiradi + original_shop_id saqlaydi

### ✅ settingsStore xodimlar muammosi (tuzatilgan)
`settingsStore` (`goodtires-settings` localStorage) xodimlarni cache qiladi. DB truncate qilsang → UI da ko'rinishda davom etadi.
✅ **Tuzatilgan**: `loadEmployees` bo'sh ro'yxatda ham `set({ employees: [] })` qiladi.

Foydalanuvchi localStorage ni qo'lda tozalashi: `localStorage.clear(); location.reload()`

### Snyk xavfsizlik xatolari — BARTARAF ETILDI
- Test fayllarida hardcoded credentials yo'q
- `tests/setup.js` — JWT_SECRET, TEST_USER, TEST_PASS env dan o'qiladi
- `package.json` jest config: `"setupFiles": ["./tests/setup.js"]`

### ✅ Real vaqt (SSE) — bajarilgan (2026-10-05)
`src/realtime.js` + frontend `src/hooks/useRealtime.js`. Batafsil — yo'l xaritasidagi "SSE orqali real vaqt" bandi.

### Fragment pattern (MUHIM — yangi qoida)
Tab fayllarida bir nechta root element bo'lsa (masalan `<motion.div>` + modal `<AnimatePresence>` bloklari), return ichini `<>...</>` fragment bilan o'rab chiq. Python script bilan bo'linganda oxirgi `</AnimatePresence>` odatda kesib qolinadi — uni qo'lda qo'shish kerak.

### Backend — 2026-06-30 da tuzatilgan muammolar

| Muammo | Sabab | Yechim |
|--------|-------|--------|
| CORS xatosi barcha endpointlarda | `cors()` middleware `helmet` va `limiter` dan KEYIN edi; preflight OPTIONS to'silardi | `cors()` eng birinchi qo'yildi, `app.use((req,res,next) => req.method==='OPTIONS' ? cors()(req,res,next) : next())` |
| `suppliers` 500 xato | `suppliers` jadvalida `is_active`, `address`, `contact_person`, `notes` ustunlari yo'q edi | `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS ...` migration |
| `selectedShopId` type mismatch | `authStore` login da `setSelectedShop(user.shop_id)` number yuborardi, lekin `mapBatch` string qaytaradi → `"1" === 1` false | `shopStore.setSelectedShop` endi `String(id)` ga o'giradi |
| `MOCK_PRODUCTS is not defined` BatchesTab da | `ctx` obyektiga `MOCK_PRODUCTS` state qo'shilmagan edi | `ctx` ga va BatchesTab destructure ga qo'shildi |
| `installmentMonths` saqlanmaydi | DB koloni, backend controller, Zod schema, frontend map/update da yo'q edi | `installment_months INTEGER[]` koloni qo'shildi, to'liq qo'shildi |
| Tovar tahrirlashda ma'lumotlar saqlanmaydi | Zod `productSchema` faqat 6 maydon — `brand`, `country`, `size` va boshqalar strip qilinardi | `productSchema` kengaytirildi, `COALESCE` UPDATE, `attribute/car_category/notes` DB koloni |
| Duplicate tovarlar | `createProduct` har safar yangi tovar yaratardi | findOrCreate (case-insensitive name check) |
| Supplier maydon majburiy | IncomeTab da supplier bo'lmasa ham kirim qilish kerak | Required validation olib tashlandi |

### DB migration log (barcha qo'shilgan ustunlar)

Quyidagilar lokal va serverda bajarilgan ✅ (endi migratsiyalar backend ishga tushganda avtomatik: `ADD COLUMN/CREATE TABLE IF NOT EXISTS`):
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS attribute TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS car_category TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS installment_months INTEGER[];
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
```

---

## SERVER DEPLOY (holat: 2026-10-09 — lokal va server BIR XIL)

**Oxirgi deploy: 2026-10-09 (28-deploy)** — backend `9f2fcd9`, frontend `15831681` (npm audit: production paketlarida 0 zaiflik, xlsx SheetJS 0.20.3, node-fetch override; users hisobi har so'rovda DB dan; frontend repo'dan node_modules kuzatuvi olib tashlandi). Serverda `npm install --omit=dev` qilindi. Zaxira `/root/backups/2026-10-09d` (node_modules bilan).

**27-deploy: 2026-10-09** — backend `6d695be`, frontend `dab18837` (Antigravity auditi: qaytarish summasi/tovarlari serverda asl chekdan + umumiy barkod xatosi, qisman qaytarish → qoldiq chek, sotuvda FOR UPDATE, balansni to'ldirish faqat admin/boshqaruvchi, Instagram webhook kalitsiz rad, to'lov webhooklari shartli UPDATE + timingSafeEqual, bron 1–24 soat, tenant faqat Host'dan). Zaxira `/root/backups/2026-10-09c`.

**26-deploy: 2026-10-09** — backend `62060f2`, frontend `71792f14` (telefonda sahifa yon tomonga surilmaydi/jadvallar kesilmaydi/inventarizatsiya; ochiq API kaliti faqat X-API-Key; FACE_ENC_KEY'siz biometrik saqlanmaydi; nginx'ga X-Forwarded-For — login limiterini soxta IP bilan aylanib o'tish yopildi). Zaxira `/root/backups/2026-10-09b`.

**25-deploy: 2026-10-09** — backend `c3444b3`, frontend `380b3eea` (yangi UI, ulgurji, ishlab chiqarish, kg sotish, server hisobotlari, ekran klaviaturasi, menyu ixcham rejimi, fiskal tayyorlov, biznes profili; eski 7 klient hisobot o'chirilgan). Zaxira `/root/backups/2026-10-09a`. Migratsiyalar xatosiz, 18 asosiy endpoint 200.

**Oldingi deploy: 2026-10-08 (24-deploy)** — backend `910a99b`, frontend `95f92b03` (AI qayta qurildi: 3 ta AI — AI yordamchi, Kundalik tahlilchi, Mijozlar boti; AI sahifasi 4 tab; tafsilot "AI agentlar arxitekturasi" bo'limida). Mijozlar boti modeli Sonnet 5.5 (foydalanuvchi qarori, qimmat bo'lsa Haiku'ga qaytaradi), Instagram kanallari o'chiq (keyin yoqiladi, yangi Meta token kerak). Zaxira `/root/backups/2026-10-08c`. Serverda `.env FACE_ENC_KEY` bor (nusxasi `/root/backups/2026-10-07a/env_with_face_key`, chmod 600). Navbat bo'sh.
Server DB HAQIQIY ma'lumot (test oyi, xodimlar telefondan ishlaydi). To'liq tarix: memory `project_server_deploy_queue.md`.

### Xavfsiz deploy tartibi (har safar)
```bash
# 0. Zaxira (D = /root/backups/<sana><harf>) — AVVAL `ls -d /root/backups/<sana>*` bilan bo'sh harfni tanla (mavjud papka ustidan yozma!)
ssh -i ~/.ssh/crm_bot root@167.233.169.118 'D=/root/backups/X; mkdir -p $D; sudo -u postgres pg_dump -Fc shina_crm > $D/shina_crm.dump; tar --exclude=node_modules -czf $D/backend.tgz -C /root shina_crm_backend; cp -a /var/www/shina-crm $D/frontend'
# 1. Backend: lokal push → serverda pull + restart (DB migratsiyalar controller boshida avtomatik, faqat ADD/CREATE IF NOT EXISTS)
git push origin master   # shina_crm_backend
ssh -i ~/.ssh/crm_bot root@167.233.169.118 'cd /root/shina_crm_backend && git pull --ff-only && npm install --omit=dev --no-audit --no-fund && pm2 restart shina-backend'  # package-lock o'zgarmagan bo'lsa npm install hech narsa qilmaydi
# 2. Frontend: build (.env.production → https://sicrm.uz) → tar|ssh → /var/www/shina-crm-new → eski assets cp -an → mv almashtirish
npm run build && git push origin main
tar -czf - -C dist . | ssh -i ~/.ssh/crm_bot root@167.233.169.118 'rm -rf /var/www/shina-crm-new; mkdir -p /var/www/shina-crm-new; tar -xzf - -C /var/www/shina-crm-new; cp -an /var/www/shina-crm/assets/. /var/www/shina-crm-new/assets/; cp -a /var/www/shina-crm/models /var/www/shina-crm-new/ 2>/dev/null; chmod -R 755 /var/www/shina-crm-new; rm -rf /var/www/shina-crm-old; mv /var/www/shina-crm /var/www/shina-crm-old; mv /var/www/shina-crm-new /var/www/shina-crm'
# 3. Tekshir: serverdagi index.html dagi assets/index-*.js lokal dist bilan bir xilmi; curl https://gt.sicrm.uz/ → 200; pm2 logs
```
- Login/qurilma qismi (`.env JWT_SECRET`, authController, middleware/auth.js, login_attempts) buzilmasa — xodimlar chiqib ketmaydi.
- Serverda qo'lda kod o'zgartirma. Server DB tuzilmasini o'zgartirish (DROP/ALTER constraint) — faqat foydalanuvchi aniq ruxsati bilan.

### Server DB bo'yicha o'rganilgan saboqlar (2026-10-04)
- Server bazasi lokaldan orqada qolishi mumkin — **deploydan oldin/muammoda ustun + cheklov + egalik diffini qil**:
  - ustunlar: `information_schema.columns` (lokal vs server)
  - cheklov/indeks: `pg_constraint` (u,c,x) + `pg_indexes` unique
  - egalik: `pg_class` owner ≠ `shina_user` (jadval/sequence) → `permission denied`
- Topilgan va tuzatilganlar: products 9 ustun yo'q edi (tovar qo'shib bo'lmasdi); `transfers` va `group_barcode_seq` postgres egaligida edi; `items_barcode_key` UNIQUE umumiy barkodni to'sardi (olib tashlandi, oddiy `idx_items_barcode`).
- `ALTER DEFAULT PRIVILEGES FOR ROLE postgres ... TO shina_user` qo'yilgan — qo'lda yaratilgan obyektlar ham ishlaydi.
- Lokal brauzer sinovi: `npx vite build --mode development --outDir dist-local` + launch.json `preview` (4173, CORS ruxsat). Oddiy `npm run build` .env.production (server API) ishlatadi — lokal sinovda ISHLATMA. Lokal admin token: backend `require('./src/utils/tokens').signAccess({id:1,role:'admin',userType:'user',...})` (scratchpad faylga, chatga chiqarma) → `localStorage.shina_token` + `shina-auth-storage`.
- **Brauzer paneli yashirin bo'lsa** framer-motion `AnimatePresence mode="wait"` tab almashinuvi tugamaydi (kadr chizilmaydi). Sinov uchun VAQTINCHA `useState(new URLSearchParams(location.search).get('tab') || ...)` qo'yib `dist-local` build qil, `?tab=` bilan och, keyin manbani `git checkout` bilan qaytar (commit qilma).
- **Mijozlar boti simulyatsiyasi**: webhook handler'ni node'da mock req/res bilan chaqir, `global.fetch` ni `instagram.com` uchun to'sib qo'y (aks holda lokal bazadagi token bilan haqiqiy Instagram'ga yozib yuborishi mumkin), sinovdan keyin sozlamani qaytar va `instagram_conversations`/`instagram_comment_log` dagi test yozuvlarini o'chir.

---

## Sessiya 2026-10-04 — BILLZ bo'limlari va yangi arxitektura

| Bo'lim | Qayerda | Muhim |
|---|---|---|
| Yetkazib beruvchilar | Kirim sahifasi: Buyurtmalar / Hisob-kitob (akt sverka) / To'lovlar tarixi / Qaytarish tablari | backend `supplierOpsController.js`, `/api/supplier-ops`; `utils/batchCore.js` (recalcBatch: qarz = jami − qaytarilgan − to'langan) |
| Mijozlar | profil: jins/manzil/email, guruh+teglar, Izohlar, Balans, Afzalliklar tablari; umumiy qarzni FIFO to'lash | `customerExtrasController.js`, `customer_notes`, `customer_balance_tx` (balans = SUM(amount)) |
| Sodiqlik | Boshqaruv→Chegirmalar: jamg'arma chegirma darajalari (kassada avtomatik), keshbek (qayd/xaridga qarab) | `utils/loyalty.js`, app_settings `loyalty`; sotuvda `balance_used`, `cashback_amount`; bekor/qaytarishda `reverseLoyalty` |
| Rollar | Rollar va ruxsat daraxti SERVERDA (app_settings `roles`), xodimga individual ruxsat (`employees.access`) | frontend `utils/rolesSync.js` (MainLayout'da sync, ilovaga qaytganda); `authStore.hasPermission` individualni hisobga oladi |
| Server ruxsat tekshiruvi | yozish amallari `requirePerm(...)`; ruxsatsizga kirim narxi/tannarx `null` qaytadi | `middleware/perm.js`; roles config serverda bo'lmasa — cheklovsiz (legacy); xodim role/access har so'rovda DB dan (`auth.js`) |
| Xato tili | xato matni ilova tilida (uz/ru), SQL xatosi yashirin | backend `middleware/errorI18n.js` (lug'at + regex), frontend `client.js` `x-lang` header; `DEBUG_ERRORS=1` faqat lokal |
| Kassa | sotuvga tayyor bo'lmagan tovar qidiruvda sababi bilan (barkod/kirim narxi/sotuv narxi); telefonda ixcham; menyu "orqaga" bilan yopiladi | `ProductSearch.jsx`, `NewSaleTab/UsedSaleTab/ReturnsTab`, `MainLayout.jsx` |
| Tovar narxi USD | tovar oynasida so'm/USD almashtirgich, saqlash so'mda | `Management/components/DualPriceInput.jsx` |
| Integratsiyalar | /integrations sahifasi: Internet-do'kon ochiq API (kalit, JSON/CSV), Telegram botda qoldiq, UDS, Payme/Click/Uzum Bank; kassada UDS ballari va QR to'lov | backend `/api/public/v1` (X-API-Key, sha256), `/api/payments/{payme,click/prepare,click/complete,uzum/:action}` (limiterdan oldin), `/api/integrations`; `utils/uds.js`, `utils/botStock.js`, jadvallar `api_keys`, `online_payments`; sozlamalar app_settings `payments`/`uds`/`integrations` |
| Moliya | `/expenses` sahifasi "Moliya": Xarajatlar, Daromadlar, Pul harakati, Foyda va zarar, Yetkazib beruvchi to'lovlari, Kapital, Kategoriyalar; Sotuvda "Kassa xarajati" | backend `financeController.js`, `/api/finance`; `finance_categories` (xarajat kategoriyalari endi serverda, `cat1..cat9` id saqlangan), `finance_incomes`; `expenses.payment_method/source('cashbox')`; pul harakati SQL UNION (sotuv, nasiya to'lovlari, B/U, qaytarish, balans, xarajat, daromad, supplier to'lov, kapital; spisaniya kirmaydi) |
| Marketing | `/marketing`: Aksiyalar, Promokodlar (kanal/vaucher/hisobot), Sertifikatlar, Telegram xabarlar, Tug'ilgan kunlar, Sozlamalar; kassada aksiya/kod/sertifikat | kassa hisob-kitobi frontendda `utils/promoEngine.js` (aksiya narxi sale_items.price ga yoziladi, `sales.promo_details`); backend `marketingController.js`, `utils/marketingDb.js` (migratsiya), `utils/marketingSale.js` (sotuv ichida kod/sertifikat, bekorda qaytarish), `utils/telegram.js` + `telegramController.js` (SMS emas — Telegram bot: app_settings `telegram` mode off/test/live, token; `POST /api/telegram/webhook` maxfiy sarlavha bilan; mijoz /start → raqam yuboradi → `customers.telegram_chat_id`; `broadcast_*` jadvallar). **Muhim:** `sales.total` = item narxlari yig'indisi (aksiya bilan), foizli chegirma `sales.discount` da alohida — net = total×(1−discount/100) |
| Hisobotlar (yangi) | Hisobotlar: Tovarlar, Ombor harakati, Kirim, Segmentlar, Do'konlar tablari (o'z davr tanlagichi, ReportTable: saralash/jami/Excel); Dashboard `DashboardSummary` | backend `reportsController.js` `/api/reports/*` (SQL, server tomonda); `utils/localTime.js` — **vaqt ustunlari serverda timestamptz, lokalda ba'zilari timestamp: sana filtrida `locDate(table,col,alias)` ishlat, `::date` emas**; sanaga qoldiq = items.created_at <= sana va (sold_at bo'sh+in_stock yoki sold_at > sana) — sold_at sotuv/spisaniya/yetkazib beruvchiga qaytarishda qo'yiladi; bot statistikasi `utils/tgStats.js` (app_settings `tg_staff`) |

**Kassada tovar sotilishi uchun 3 shart:** barkod bor + kirim narxi kiritilgan (`has_missing_price=false`) + sotuv narxi > 0. Sotuvchi kirimda narx kiritolmaydi (admin/boshqaruvchi to'ldiradi).

**Yangi UI yozishda (telefon):** katta bo'shliqlarga telefon qiymati qo'sh (`p-4 sm:p-6`, `gap-3 sm:gap-6`, `space-y-4 sm:space-y-6`, `text-2xl sm:text-3xl`, jadval kataklari `px-3 sm:px-4 py-2.5 sm:py-4`); tab paneli `overflow-x-auto no-scrollbar`, faol bo'lmagan tab nomi `hidden sm:inline`; sarlavha+tugmalar qatori `flex flex-wrap ... gap-2`. Yangi sahifa tablari ruxsat daraxtiga qo'shilsin va `hasPermission('<sahifa>.<tab>')` bilan filtrlansin (bo'limning qisman belgilangan tablari ham ishlaydi). Sahifa xatolari `PageErrorBoundary` (MainLayout) bilan ushlanadi.

**Yangi kod yozishda:** yangi yozish route'iga `requirePerm('<daraxt id>')` qo'sh; yangi backend xato matnini `errorI18n.js` lug'atiga qo'sh (uz+ru); yangi jadval — controller boshida `CREATE TABLE IF NOT EXISTS`.

---

## AI agentlar arxitekturasi (2026-10-08 qayta qurilgan — shu tuzilmani saqla)

**3 ta AI: AI yordamchi + Kundalik tahlilchi (tahlil) va Mijozlar boti (mijozlarga javob).** Raqamlar HAR DOIM SQL'dan; AI faqat sharhlaydi. Admin panel → AI Agentlar: 2 guruh — "Tahlil agentlari" (jadval vaqti + 2 karta) va "Mijozlar bilan muloqot botlari" (1 karta).
- **Yagona SQL manba:** backend `utils/aiSections.js` — 5 bo'lim (sales, inventory, customers, marketing, staff) uchun KPI (`{key,label,value,prev,unit,sensitive,invert}`), ro'yxatlar va AI uchun `forAi()`. AI Agent tabidagi kartalar, kundalik tahlilchi va yordamchining `get_section_report` tooli shu bitta funksiyadan oladi — raqam hamma joyda bir xil. Yangi KPI shu faylga qo'shiladi (+ ru tarjima `aisec_kpi_<key>`, ustun `aisec_col_<list>_<col>`; uz nomi backend label'dan).
- **AI yordamchi** (`ai-assistant`, kind `assistant`): har bo'lim tabidagi chat. `POST /api/ai/chat` `{agentId:'ai-assistant', section}` — prompt `agents/prompts.js` `buildAssistantPrompt` (mijoz yuborgan systemPrompt e'tiborga olinmaydi), toollar `ASSISTANT_TOOLS` ichidan (faqat o'qish). Suhbat tarixi bo'lim bo'yicha alohida (`chatKey`).
- **Kundalik tahlilchi** (`daily-analyst`, kind `analyst`): `agents/dailyAnalyst.js` — har bo'lim uchun 1 ta AI chaqiruv (Sonnet 5.5, structured output `DIGEST_SCHEMA`), `ai_digest_runs`/`ai_digests` jadvallari. Jadval: app_settings `ai_schedule` `{hour}` (Toshkent, default 7), har 5 daqiqada tekshiradi; yangi faollik bo'lmasa `skipped`. Dushanba — haftalik hisobot (`aiStats.generateWeekly`). Sezgir bandlar (foyda/tannarx) `canSeeProfit` bo'lmasa yashiriladi (model belgisi + regex).
- **Prompt qoidasi:** asosiy qoidalar KODDA (`agents/prompts.js`, deploy bilan yangilanadi, Admin panelda faqat ko'rinadi); egasining qo'shimchalari bazada (`ai_agents.custom_instructions`, `section_instructions {sec:{enabled,text}}`, `knowledge`). Admin panel → AI Agentlar → "Tahlil agentlari".
- **Mijozlar boti** (kind `customer_bot`, slug `instagram-agent` — Instagram token/sozlamalari shu yozuvda): Instagram komment + DM (keyinchalik Telegram) bitta bot. Qoidalar `agents/botPrompts.js` (`BOT_BASE` + `BOT_CHANNELS[comment|dm|telegram]`, `buildBotPrompt`), do'konlar manzili/ish vaqti `shops`dan avtomatik; egasining qo'shimchalari `custom_instructions`, `knowledge`, `section_instructions {comment|dm|telegram: {text}}`. Kanal holati `integrations.instagram.enabled` / `dmEnabled` (true=yoniq). Toollar `CHANNEL_TOOLS` (kommentda faqat qidiruv+aksiya), `runBotTool` mijoz ma'lumotini faqat yozayotgan odamga cheklaydi. Webhook manzillari (`/api/ai/instagram`, `/api/ai/instagram-dm`) va javob formati o'zgarmagan. instagram-dm-agent, telegram-agent — archived. Bot tegishdan oldin foydalanuvchidan so'ra; haqiqiy Instagram sinovi yangi Meta token bilan.
- **Eski** sales/product/pr/customer/staff/stats agentlari `kind='legacy', archived=true` (o'chirilmagan, ishlatilmaydi). Eski agentRunner, `/api/agents/*`, useAgentAnalysis, AgentAnalysisPanel olib tashlangan.
- **AI Agent sahifasi — 4 tab (vazifa bo'yicha):** Kunlik tahlil (`tabs/DailyTab` — 5 bo'lim akkordeon, `/api/ai-stats/anomalies`, "Raqamlarni ko'rish" → `components/SectionData`), AI yordamchi (`tabs/AssistantTab`, bitta chat), Statistika (`tabs/StatsTab`), Instagram (`tabs/InstagramTab` — raqamlar `aiSections` 'instagram' dan; DM/bot panellari o'zgarmagan). Yangi bo'lim tab qo'shma — bo'limlar Kunlik tahlil ichida.
- Sonnet/Opus 5.5: thinking doim yoqiq → tool zanjirida `stream.finalMessage()` content'ini o'zgarishsiz qaytar; `tool_choice: any` va `temperature` 400 beradi.

## Domen (holat 2026-10-07)

**Asosiy domen — `sicrm.uz`** (ishlaydi, SSL bor): `sicrm.uz` = backend API, `gt.sicrm.uz` = GoodTires ilovasi. `crmsi.uz` domeni muammo tufayli ISHLATILMAYDI — nomi `sicrm.uz` ga o'zgartirilgan; serverdagi `/etc/nginx/sites-available/crmsi.uz` eskirgan (yoqilmagan).
Yangi mijoz (tenant) kerak bo'lganda: DNS `*.sicrm.uz` A → 167.233.169.118, wildcard SSL (`certbot certonly --manual --preferred-challenges dns -d "*.sicrm.uz" -d sicrm.uz`), nginx wildcard server_name `~^(?<tenant>[^.]+)\.sicrm\.uz$`, ALLOWED_ORIGINS ga qo'shish, tenant middleware'da `getPool`. Quyidagi crmsi.uz buyruqlari — tarixiy (domen nomini sicrm.uz ga almashtirib ishlat).

### Eski reja: crmsi.uz buyruqlari (TARIXIY)

Nginx config va tenant middleware tayyor — `/etc/nginx/sites-available/crmsi.uz` yozilgan. Domen DNS ga ulanib propagatsiya bo'lgach quyidagilarni bajarish kerak:

```bash
# 1. SSL sertifikat olish (faqat asosiy domen — wildcard alohida)
certbot --nginx -d crmsi.uz -d www.crmsi.uz

# 2. Nginx wildcard config yoqish
ln -s /etc/nginx/sites-available/crmsi.uz /etc/nginx/sites-enabled/crmsi.uz
nginx -t && systemctl reload nginx

# 3. ALLOWED_ORIGINS ga domen qo'shish (.env ni tahrirlash)
# /root/shina_crm_backend/.env da qo'shiladi:
# ALLOWED_ORIGINS=...,https://crmsi.uz,https://www.crmsi.uz
# Keyin:
cd /root/shina_crm_backend && pm2 restart shina-backend --update-env
```

**Yangi mijoz (tenant) qo'shish:**
```bash
# Serverda:
/root/create_tenant.sh <tenant_slug>
# Misol: /root/create_tenant.sh goodtires2
# Bu shina_crm_goodtires2 DB yaratadi va sxemani ko'chiradi
```

**Tenant middleware holati:** `src/middleware/tenant.js` — hozir barcha tenantlar bitta DB (`shina_crm`) ishlatadi. Ko'p mijoz bo'lganda middleware ichida `getPool(\`shina_crm_\${tenant}\`)` qo'shiladi.
