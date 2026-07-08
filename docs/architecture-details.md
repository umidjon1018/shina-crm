# Architecture Details

## Auth & Permissions
- Ikki bosqichli login: credentials → selfie → device trust
- Yangi qurilma: pending → admin approveDevice()
- Trusted devices: localStorage `shina_trusted_devices`
- Permissions: warehouse, sales, income, expenses, reports, ai_agent
- ['all'] = admin. ProtectedRoute → hasPermission()
- Hardcoded users: mock.js. Xodimlar: settingsStore.employees

### Granular ruxsatlar (sahifa → tab → ustun)
- `src/config/permissionTree.js` — PERMISSION_TREE: butun ilova bo'yicha sahifa/tab/ustun daraxti, id'lar nuqta bilan (`reports.profit.cost`)
- `settingsStore.roleAccessTrees` — har bir rol (`manager`,`seller`,`storekeeper`,`technician`) uchun ruxsat etilgan node id'lar ro'yxati. Parent checked = barcha avlodlar ruxsat
- `authStore.hasPermission('reports.used')` — ierarxik kalitni prefiks bo'yicha tekshiradi
- Admin Panel → Xodimlar tab → "Rol bo'yicha ruxsatlar" — checkbox daraxt UI (`PermissionTree.jsx`). Boshqaruvchi daraxti — boshqa rollar uchun "ceiling" (ulardan tashqarisini tanlab bo'lmaydi)
- Konventsiya (yangi sahifa/tab qo'shilganda): sahifa o'z tablarini `hasPermission('<page>.<tab>')` bilan filtrlaydi, ustun yashirish — `hasPermission('<page>.<tab>.<column>')`. Yangi node — `permissionTree.js`ga qo'shiladi
- Admin tegmagan ma'lumot: `employee.createdBy`/`lastEditedBy` — Admin Panel orqali admin xodim qo'shsa/tahrirlasa `'admin'` qo'yiladi. Management.jsx `canManageEmployee()` — agar shu maydonlar `'admin'` bo'lsa, Boshqaruvchi tahrirlash/o'chirish/bloklash tugmalarini ko'rmaydi
- Xodim o'chirish — ikki bosqichli (Boshqaruvchi → Admin tasdiqlovi):
  - Boshqaruv → Xodimlar: Boshqaruvchi "O'chirish" bossa `requestEmployeeDeletion()` — `pendingDelete: true`, xodim hali `isActive`, lekin Boshqaruv ro'yxatidan yashiriladi
  - Admin Panel → Xodimlar: `pendingDelete` xodimlar "O'chirish so'rovlari" bo'limida ko'rinadi (badge "⏳ O'chirish so'rovi")
    - "Tasdiqlash" → `approveEmployeeDeletion()` — `isActive:false` (oddiy soft-delete, tarix/savdo ma'lumotlari saqlanadi)
    - "Bekor qilish" → `cancelEmployeeDeletion()` — xodim Boshqaruv ro'yxatiga qaytadi, `lastEditedBy:'admin'` qo'yiladi (shundan keyin Boshqaruvchi bu xodimni qayta o'chira olmaydi)
  - Admin to'g'ridan-to'g'ri o'chirsa — `removeEmployee()` (tasdiqlovsiz, darhol nofaol)

## Zustand Stores
- authStore — session, device, permissions
- settingsStore — USD rate, xodimlar, nasiya, chegirma, loyalty, notifications (`goodtires-settings`)
- shopStore — filiallar, tanlangan do'kon (`goodtires-shop-store`)
- cartStore — aktiv POS savati (`goodtires-cart`)
- notificationStore — bildirishnomalar (`goodtires-notifications`)
- dataStore — version + bump() (persist yo'q)
- themeStore / langStore — UI

## Offline Support
- src/utils/offlineQueue.js — IndexedDB (`shina_crm_offline`)
- enqueueAction({type, payload}) — qo'shish
- syncQueue(apiHandler) — qayta ulanishda ishlash
- useOfflineSync hook — MainLayout da auto-sync + badge

## UI Conventions
- CSS vars: bg-bg-primary, text-accent-red, border-border
- Sahifa tuzilmasi: TABS array + activeTab useState
- Animatsiya: Framer Motion
- Narx formati: n?.toLocaleString('uz-UZ') + " so'm"
