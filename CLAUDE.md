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
   - `mock.js` funksiyalari to'liqmi?
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

## Working Agreement (read every session)

We work page by page. The user describes what needs to be done; Claude does it or says it's already done.

**Rules:**
1. All data lives in `src/api/mock.js` — add/edit/delete must mutate these arrays dynamically
2. Pages update via local `useState` + `useDataStore().bump()` — never reload the page
3. When connecting a card/modal from one page to another, use `bump()` so the target page receives data automatically
4. Do not add features beyond what is explicitly requested
5. Do not add comments unless the WHY is non-obvious

## Architecture Overview

**Shina CRM** is a fully client-side React SPA for managing a tire/wheel shop chain (GoodTires). There is no backend — all data lives in `src/api/mock.js` and Zustand stores persisted to `localStorage`.

### Data Layer

Two sources of truth:

1. **`src/api/mock.js`** — module-level mutable arrays: `MOCK_PRODUCTS`, `MOCK_BATCHES`, `MOCK_ITEMS`, `MOCK_SALES`, `MOCK_CUSTOMERS`, `MOCK_SUPPLIERS`, `MOCK_INCOME_BATCHES`, `MOCK_EXPENSES`, `MOCK_CAPITAL`, `MOCK_RETURNS`. Mutations persist for the browser session only (reset on reload). All async helper functions (`getStock()`, `getBatches()`, `createSale()`, `addBatch()`, etc.) live here too.

2. **Zustand stores** (all `persist` → `localStorage`):
   - `authStore` — session, device approval, permissions
   - `settingsStore` — USD rate, employees, installment orgs, discount rules, loyalty thresholds, notification toggles (`goodtires-settings`)
   - `shopStore` — branch list, selected shop (`goodtires-shop-store`)
   - `cartStore` — active POS cart (`goodtires-cart`)
   - `notificationStore` — in-app notifications with read/unread (`goodtires-notifications`)
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

**Where `bump()` is already called:** Sales (`createSale`, `cancelSale`, `addReturn`), Income (`addBatch`, `addPaymentToBatch`), Customers (`add`, `edit`, `delete`, installment payment), Management (product price edit, product delete), Warehouse (barcode generate, print, download).

### Inventory Model (3-level hierarchy)

```
MOCK_PRODUCTS → MOCK_BATCHES → MOCK_ITEMS
  (product)     (purchase lot)  (individual unit with barcode)
```

- **product**: `cashPrice`, `minSalePrice`, `installmentBasePrice`, `category` (`tire`|`wheel`|`accessory`)
- **batch**: supplier, date, `quantityIn`, `quantityRemaining`, `shopId`
- **item**: single physical unit. `barcode: null` = cannot be sold. `barcodeStatus`: `null → active → printed | downloaded → inactive` (after sale)

`getStock(productId)` — counts `in_stock` items. `getBarcodeReadyStock(productId)` — counts barcoded+in_stock. `findItemByBarcode(barcode)` — lookup for POS scanner.

### Auth & Permissions

Two-step login: credentials → selfie → device trust. New devices go `pending` until admin approves via `approveDevice()`. Trusted device IDs in `localStorage` key `shina_trusted_devices`.

Permission values: `warehouse`, `sales`, `income`, `expenses`, `reports`, `ai_agent`. `['all']` = admin full access. `ProtectedRoute` checks `hasPermission()`.

Hardcoded users in `mock.js`. Management-added employees in `settingsStore.employees` — both checked by `authStore.checkCredentials()`.

### Routing & Layout

- `AuthLayout` — `/login`, `/pending-approval`
- `MainLayout` — all protected routes; sidebar with permission-filtered nav, offline badge, lang/theme toggles

React Router v6 — pages **unmount on navigation** (no caching), so re-mounting always reads fresh mock arrays.

### Deployment & Tijoratlashtirish Yo'l Xaritasi (qoida — har doim eslab qolinsin)

Bu bo'lim foydalanuvchi bilan PWA/SaaS strategiyasi haqida bo'lib o'tgan suhbat xulosasi. Loyiha shu yo'naltiruvchi reja asosida rivojlantiriladi — kelajakda tegishli bosqichga yetganda shu yerdan eslab, mos qadamlarni taklif qilish kerak.

**Bosqich 1 — Frontendni tugatish (hozirgi holat, ~70%)**
- Davom etilayotgan ish. Backend/SaSa haqida hozircha amaliy qadam tashlanmaydi.

**Bosqich 2 — PWA qilib chiqarish ✅ BAJARILDI (2026-06-07)**
- `vite-plugin-pwa` o'rnatildi, `vite.config.js` ga `VitePWA` konfiguratsiyasi qo'shildi (manifest, service worker, ikonlar, runtime caching). `public/icons/` da 192/512/maskable PNG ikonlar yaratildi (PIL bilan, "GT" + accent-red brand rang). `index.html` ga manifest link, theme-color, apple-mobile-web-app meta teglar qo'shildi. `npm run build` muvaffaqiyatli — `dist/` da `manifest.webmanifest`, `sw.js`, `registerSW.js` generatsiya qilinadi. Endi loyiha brauzerda "O'rnatish"/"Bosh ekranga qo'shish" orqali App sifatida o'rnatiladi.
- Sabab: hozirgi arxitektura (backend yo'q, `mock.js` + `localStorage`) PWA bilan to'liq mos, kodga deyarli tegmasdan amalga oshadi.
- **Termal printer cheklovi**: brauzer/PWA xom (raw) TCP socket ocholmaydi → WiFi termal printerlarga ESC/POS orqali to'g'ridan-to'g'ri chop etish PWA ichidan ishlamaydi. Shu funksiya kerak bo'lganda loyiha **Capacitor** bilan native qobiqqa o'raladi (faqat shu qism uchun maxsus plagin qo'shiladi, qolgan kod o'zgarmaydi). Bluetooth printerlar uchun Web Bluetooth API variant bo'lishi mumkin, WiFi uchun emas. Hozirgi barcode generatsiya/print (`window.print()`) va kamera orqali skanerlash — PWA bilan muammosiz ishlaydi, o'zgartirish shart emas.

**Bosqich 3 — Tijoratlashtirish: "alohida nusxalar" (white-label) modeli**
- Har bir tadbirkor (jiyan, shogird, boshqa mijoz) uchun alohida sozlangan build (o'z `companyName`/`companyLogo`/narxlari bilan) tayyorlanadi — `Konfiguratsiya` va `Sozlamalar` bloklari shu uchun ishlatiladi.
- Hosting: bitta hosting hisobida (Vercel/Netlify/Cloudflare Pages yoki bitta VPS + Nginx) bir nechta loyihani joylashtirish va har biriga alohida domen/subdomen ulash mumkin — har biriga alohida hosting sotib olish shart emas.
- Domen: bitta asosiy domen sotib olib, har bir mijoz uchun subdomain (`mijoz1.brend.uz`, `mijoz2.brend.uz`) ochish — eng tejamkor yo'l.
- **Ma'lumotlar izolyatsiyasi**: hozirgi arxitekturada baza yo'q (`mock.js`+`localStorage`) — har bir o'rnatish o'z-o'zidan butunlay mustaqil va izolyatsiyalangan. Bu "bitta umumiy baza" emas, balki "ko'p mustaqil nusxalar" demakdir — ma'lumotlar hech qachon aralashmaydi.
- **AI Agent obunasi**: AI xizmati API kalitiga bog'liq va to'lov kalit egasidan yechiladi. Bitta umumiy kalitni barcha nusxalarga qo'yish — boshqalarning xarajati sizning hisobingizdan ketishiga olib keladi. Yechim: AI Agent sahifasiga/Sozlamalarga "API kalit kiritish" maydoni qo'shilishi kerak — har bir mijoz o'z kalitini kiritadi va o'zi to'laydi. Agar mijoz AI'ni xohlamasa — `hiddenPages` orqali shu bo'lim yashiriladi (bu funksiya allaqachon mavjud).

**Bosqich 3.5 — Backend xavfsizlik yaxshilanishlari (SaaS DAN OLDIN bajarilishi kerak)**

Quyidagilar hozirgi backend (Node.js + PostgreSQL) da qilinishi kerak, lekin SaaS arxitekturasi bilan bog'liq emas:

1. **`selfie` va `descriptor` ni bazada shifrlash** — biometrik ma'lumotlar hozir ochiq JSONB sifatida saqlanadi. PostgreSQL `pgcrypto` yoki application-level AES-256 shifrlash qo'shilishi kerak. `descriptor` — 128-float vector; `selfie` — base64 rasm. Ikkalasi `LOGIN_ATTEMPTS` jadvalida.

2. **`faceMatch` serverda tekshirish** — hozir `faceMatch: true/false` qiymati frontenddan keladi, backend ishonadi. Haqiqiy biometrik tekshiruv uchun: backend `face_descriptor` ni `users` dan olib, frontenddan kelgan `descriptor` bilan o'zi solishtirishi kerak. Node.js da `face-api.js` yoki Python microservice (FastAPI + `deepface`) qo'shilishi mumkin. Threshold: Euclidean distance < 0.5.

3. **JWT muddatini qisqartirish + refresh token** — hozir `expiresIn: '7d'`. Token o'g'irlansa 7 kun xavf. Yechim:
   - `access_token`: 15 daqiqa
   - `refresh_token`: 7 kun (HttpOnly cookie yoki alohida DB jadval)
   - `POST /api/auth/refresh` endpoint
   - Frontend: `axios` interceptor 401 bo'lsa refresh qiladi

4. **`allow_multi_device` nazoratini to'liq qo'llash** — hozir faqat `/api/auth/attempts` da tekshiriladi. Login jarayonida ham (token berilgandan keyin) sessiya soni cheklanishi kerak. Bu WebSocket/SSE bilan birlashtirilishi lozim.

**Bosqich 4 — SaaS (multi-tenant) ga o'tish — faqat talab tasdiqlangandan keyin**
- Bu bosqichda backend + ma'lumotlar bazasi (masalan PostgreSQL) yoziladi, `mock.js` dagi mantiq (`getStock`, `createSale`, `addBatch` va h.k.) serverga ko'chiriladi, frontend `fetch`/`axios` orqali API bilan ishlaydigan bo'ladi.
- Multi-tenant izolyatsiya: har bir yozuvga `tenantId`/`businessId` qo'yiladi, har bir foydalanuvchi faqat o'ziga tegishli ma'lumotni ko'radi. Bitta domen, turli login/parollar.
- Obuna (subscription) va to'lov tizimi (Click/Payme) integratsiyasi shu bosqichda qo'shiladi.
- Oylik infratuzilma narxi (server+baza+email+backup) — kichik miqyosda taxminan $15-60/oy atrofida.
- **Bu bosqichga hozir o'tish tavsiya etilmaydi** — sabab: frontend hali tugamagan, talab hali sinalmagan, va frontend tugagach SaaS arxitekturasi ancha aniqroq rejalashtiriladi (kod zoye ketmaydi — React qism deyarli o'zgarishsiz qoladi).

**MUHIM — WebSocket/SSE: eng muhim arxitektura vazifasi (backend ishga tushgach birinchi navbatda)**

Bu vazifa **frontend yoki SaaS dan oldin** bajarilishi kerak. Sababi:

**Hozirgi muammo (vaqtinchalik yamoqlar):**
- `PendingApproval.jsx` — 3 soniyalik polling (`checkApprovalStatus`). Bu faqat bitta brauzer ichida ishlaydi. Boshqa qurilmada pending turgan xodim admin tasdiqlashini polling orqali biladi — bu server yukini oshiradi va kechikish beradi.
- Qurilma revoke qilinganda eski qurilma **darhol chiqarib yuborilmaydi** — faqat keyingi API so'rovida (1-2 soniya) 403 oladi va redirect bo'ladi.

**Eng muhim — ruxsatlar real-vaqt yangilanmaydi:**
Admin xodimning ruxsatini (permissions) o'zgartirganda — o'sha xodim ekrani **qayta kirmasdan, sahifa yangilanmasdan darhol o'zgarishi kerak**. Hozir bu ishlamaydi: xodim yangi ruxsatni faqat qayta login qilganda ko'radi. Bu operatsion xavf — masalan, ishdan bo'shatilgan xodim ruxsati o'chirilgandan keyin ham tizimda ishlashda davom etishi mumkin (token muddati tugaguncha — 7 kun).

**WebSocket/SSE bilan hal qilinadigan muammolar (muhimlik tartibida):**

1. 🔴 **Ruxsatlar darhol kuchga kirishi** — admin `PATCH /employees/:id` qilganda → server o'sha xodimning WebSocket sessioniga `permissions_updated` event yuboradi → frontend `authStore` yangilanadi → sahifa refresh siz o'zgaradi
2. 🔴 **Qurilma revoke — darhol logout** — `revokeDevice` chaqirilganda → server eski qurilmaga `device_revoked` event → frontend darhol `/login` ga redirect
3. 🟡 **Qurilma tasdiqlash — polling o'rniga push** — `approveAttempt` → server pending qurilmaga `device_approved` event → `PendingApproval.jsx` polling o'chadi
4. 🟡 **Yangi kirish urinishi — admin ga push** — `saveAttempt` → server admin/manager sessionlariga `new_login_attempt` event → bildirishnoma darhol chiqadi

**Texnik yo'l (socket.io + JWT auth):**
```js
// Backend — src/socket.js
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  socket.user = jwt.verify(token, process.env.JWT_SECRET)
  next()
})

// Har bir user o'z room'iga kiradi
socket.join(`user:${socket.user.id}`)
if (['admin','manager'].includes(socket.user.role)) {
  socket.join('admins')
}

// Ruxsat o'zgarganda (employeesController.js da):
io.to(`user:${targetUserId}`).emit('permissions_updated', { permissions })

// Qurilma revoke bo'lganda:
io.to(`device:${deviceId}`).emit('device_revoked')
```

```js
// Frontend — src/hooks/useRealtimeSync.js
useEffect(() => {
  const socket = io(API_URL, { auth: { token } })
  socket.on('permissions_updated', ({ permissions }) => {
    useAuthStore.getState().updatePermissions(permissions)
  })
  socket.on('device_revoked', () => {
    useAuthStore.getState().logout()
    navigate('/login')
  })
  socket.on('device_approved', () => {
    useAuthStore.getState().checkApprovalStatus()
  })
  return () => socket.disconnect()
}, [token])
```

**Backend hozir tayyor** — faqat `socket.io` paketi o'rnatib, `src/socket.js` fayl yozib, `src/index.js` ga ulash qoladi. Frontend tomonda `useRealtimeSync` hook `MainLayout.jsx` va `PendingApproval.jsx` ga qo'shiladi.

**Qachon bajariladi:** Real foydalanuvchilar ishlatayotgan payt — ishdan bo'shatilgan xodim hali tizimda ishlashda davom etsa yoki admin ruxsatni o'zgartirib xodim buni bilmasa. Bu bitta ish kuni talab qiladi.

**Talab qilingan, lekin backendsiz ILOJI YO'Q funksiya — eslatma (so'ralgan: 2026-06-07):**
- Foydalanuvchi so'radi: "Bir xodim bir vaqtda faqatgina bitta qurilmadan kira olsin (ikkinchisidan kirish uchun birinchidan chiqishi kerak), lekin Adminga bu cheklov tegmasin — Admin istagancha qurilmadan bir vaqtda kira olishi kerak."
- **Bu — real-vaqt sessiya nazorati va backendsiz ishlamaydi.** Sabab: `deviceId` har bir brauzerga tegishli (foydalanuvchiga emas), va `localStorage` faqat o'sha brauzer ichida ko'rinadi — masalan, Sardor telefonda kirgan bo'lsa, PC brauzeri bu haqda umuman bilolmaydi (xavtsizlik siyosati tufayli boshqa origin/brauzer localStorage'iga kirish mumkin emas).
- Backend qurilganda amalga oshirish yo'li: serverda har bir foydalanuvchi uchun `activeSessionDeviceId`/`activeSessionToken` saqlanadi; yangi qurilmadan login qilinganda — agar foydalanuvchi `role !== 'admin'` bo'lsa va eski faol sessiya mavjud bo'lsa, server eski sessiyani bekor qiladi (token invalidate) va **WebSocket/SSE orqali** eski qurilmaga "Sizning sessiyangiz boshqa qurilmadan ochildi — chiqib ketdingiz" deb signal yuboradi (shu joyda ham yuqoridagi WebSocket/SSE qoidasi ishga tushadi). Admin uchun bu cheklov qo'llanilmaydi (`role === 'admin'` bo'lsa — istalgancha parallel sessiyaga ruxsat).

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

## Session Notes (last updated: 2026-06-30)

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

### mock.js — Muhim funksiyalar
- `mergeCustomers(keepId, removeId)` — mijozlarni birlashtiradi, salesni ko'chiradi
- `addCustomer` — ID: `reduce` max + 1 (collision yo'q)

### Expenses.jsx — Tayyor xususiyatlar
- Do'kon xarajatlari tab: CRUD, oy filtri, kategoriya breakdown, qidiruv, valyuta filtri, pagination
- Yetkazib beruvchi to'lovlari tab: readonly (Income dan), pagination, do'kon filtri, qidiruv, supplierName MOCK_SUPPLIERS dan o'qiladi
- Kapital harakati tab: CRUD, oy filtri, pagination

### Multido'kon funksiyasi qo'shilganda (kelajak)
Hozir har bir tabda alohida `filterShop` local state bor.
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
4. **Bo'lgandan keyin ALBATTA tekshir**: har bir split fayl o'z importlarini to'liq o'z ichida olib yurishi kerak — hook, icon, mock funksiya barchasi
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

### Keyingi session (2026-10-04 dan keyin)
BILLZ paritet ishlari davom etadi: foydalanuvchi keyingi BILLZ bo'limi ro'yxatini beradi → har bandni kodda tekshir (bor/qisman/yo'q jadval) → yo'q va kamchiliklarni HAMMASINI qil → lokal test → commit → deploy faqat "deploy" deyilganda. Batafsil: memory `project_next_billz_plan.md`.
Ochiq vazifalar: AI kredit xatosi tekshiruvi (`project_ai_credit_issue_todo.md`, foydalanuvchi "AI'ni tekshir" desa), Telegram bot (token kutilmoqda, `project_telegram_auth_todo.md`).

### O'lchov birligi tizimi (2026-08-14 da qo'shildi)

- `src/components/UnitInput.jsx` — select + "Boshqa..." combo, X tugma bilan tozalash
- `UNIT_OPTIONS = ['dona', 'metr', 'litr', 'kg', 'gramm', 'juft', 'ta']` — predefined, + erkin matn
- **Batch darajasida** (product emas) — har do'kon o'zinikini tanlaydi kirim vaqtida
- DB: `batches.unit VARCHAR(20) DEFAULT 'dona'` — lokal DB da qo'shildi (Hetzner da HALI yo'q!)
- **Hetzner migration KERAK**: `ALTER TABLE batches ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'dona';`
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

## Backend holati (2026-06-30 da yangilandi)

### Backend nima?
`C:\Users\Umidjon\Desktop\shina_crm_backend` — Node.js + Express + PostgreSQL.
Frontend `src/api/index.js` orqali ulanadi (`VITE_API_URL` env dan).

### Backend tuzilmasi
```
src/
  controllers/   — authController, shopsController, employeesController, ...
  routes/        — auth.js, shops.js, employees.js, ...
  middleware/    — auth.js (authMiddleware, adminOnly, adminOrManager, authMiddlewareNoDeviceCheck)
  db.js          — pool (PostgreSQL)
  index.js       — Express app entry
tests/
  setup.js       — Jest env vars (JWT_SECRET, TEST_USER, TEST_PASS)
  auth.test.js   — login/auth testlar
  adminOnly.test.js
```

### Muhim backend endpointlar
| Endpoint | Izoh |
|----------|------|
| `POST /api/auth/login` | Login (username + password + deviceId) |
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

### settingsStore xodimlar muammosi (MUHIM)
`settingsStore` (`goodtires-settings` localStorage) xodimlarni cache qiladi. DB truncate qilsang → UI da ko'rinishda davom etadi.
**Yechim**: `loadEmployees` funksiyasi `emps.length === 0` bo'lsa ham `set({ employees: [] })` chaqirishi kerak. Hozir bu **TUZATILMAGAN** — keyingi sessiyada tuzatish kerak.

Foydalanuvchi localStorage ni qo'lda tozalashi: `localStorage.clear(); location.reload()`

### Snyk xavfsizlik xatolari — BARTARAF ETILDI
- Test fayllarida hardcoded credentials yo'q
- `tests/setup.js` — JWT_SECRET, TEST_USER, TEST_PASS env dan o'qiladi
- `package.json` jest config: `"setupFiles": ["./tests/setup.js"]`

### WebSocket/SSE — ENG MUHIM KEYINGI VAZIFA
(CLAUDE.md ning WebSocket/SSE bo'limiga to'liq yozilgan — o'sha bo'limni o'qi)
Hali bajarilmagan. Real foydalanuvchilar paytida bajariladi.

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

Quyidagilar **lokal DB da** bajarilgan (2026-06-30):
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

## SERVER DEPLOY (holat: 2026-10-04 — lokal va server BIR XIL)

**Oxirgi deploy: 2026-10-05 (18-deploy)** — backend `2e25cb9`, frontend `5a513ec9`. Navbat bo'sh.
Server DB HAQIQIY ma'lumot (test oyi, xodimlar telefondan ishlaydi). To'liq tarix: memory `project_server_deploy_queue.md`.

### Xavfsiz deploy tartibi (har safar)
```bash
# 0. Zaxira (D = /root/backups/<sana><harf>)
ssh -i ~/.ssh/crm_bot root@167.233.169.118 'D=/root/backups/X; mkdir -p $D; sudo -u postgres pg_dump -Fc shina_crm > $D/shina_crm.dump; tar --exclude=node_modules -czf $D/backend.tgz -C /root shina_crm_backend; cp -a /var/www/shina-crm $D/frontend'
# 1. Backend: lokal push → serverda pull + restart (DB migratsiyalar controller boshida avtomatik, faqat ADD/CREATE IF NOT EXISTS)
git push origin master   # shina_crm_backend
ssh -i ~/.ssh/crm_bot root@167.233.169.118 'cd /root/shina_crm_backend && git pull --ff-only && pm2 restart shina-backend'
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
- Lokal brauzer sinovi: `npx vite build --mode development --outDir dist-local` + launch.json `preview` (4173, CORS ruxsat). Oddiy `npm run build` .env.production (server API) ishlatadi — lokal sinovda ISHLATMA. Lokal admin token: backend `.env` JWT_SECRET bilan `jwt.sign` (scratchpad faylga, chatga chiqarma).

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

**Yangi kod yozishda:** yangi yozish route'iga `requirePerm('<daraxt id>')` qo'sh; yangi backend xato matnini `errorI18n.js` lug'atiga qo'sh (uz+ru); yangi jadval — controller boshida `CREATE TABLE IF NOT EXISTS`.

---

## Domen faollashtirish buyruqlari (crmsi.uz tayyor bo'lgach)

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
