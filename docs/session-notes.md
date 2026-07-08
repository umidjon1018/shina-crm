# Session Notes

_Last updated: 2026-06-14_

## Sahifalar holati

| Sahifa | Holati |
|--------|--------|
| Sales.jsx | ✅ Tayyor — o'zgartirilmasin |
| Customers.jsx | ✅ Tayyor — o'zgartirilmasin |
| Expenses.jsx | ✅ Tayyor — o'zgartirilmasin |
| Warehouse.jsx | ✅ Tayyor |
| Income.jsx | ✅ Tayyor |
| Reports.jsx | ✅ Tayyor (B/U tovarlar tabi: oy filtrlari + global davr filtri) |
| Management.jsx | 🔄 Davom etmoqda |
| AdminPanel.jsx | ✅ Tayyor (6 tab: Xodimlar, Qurilmalar, Audit, Aksiyalar, Do'konlar, Sozlamalar) |

## Sales.jsx — Tab holati

| Tab | Holati |
|-----|--------|
| new_sale | ✅ |
| history | ✅ |
| returns | ✅ |
| returns_history | ✅ |
| installment | ✅ |
| profit | ✅ |
| used (B/U sotuv) | ✅ — utilizatsiyaga topshirish jarayoni qo'shildi |

### B/U sotuv tabi — utilizatsiya jarayoni
- "Utilizatsiyaga topshirish" bosilganda mijoz nomi avtomatik "Utilizatsiya" bo'ladi va jadvalga shu nom bilan tushadi
- Chap paneldagi B/U ombor ro'yxati kategoriya bo'yicha filtrlanadi
- Bir xil tovar (acquiredSaleId + name + category + price) guruhlanib, soni va tan narxi (dona/jami) ko'rsatiladi
- Utilizatsiya jarayonida "Mijoz manbasi" tanlovi deaktivatsiya qilingan

## Reports.jsx — B/U tovarlar tabi
- Utilizatsiya orqali sotilgan tovarlar "Utilizatsiya qilingan" kartasiga hisoblanadi
- Har bir karta/modal (7 ta), "Kategoriya bo'yicha aylanma" grafigi va "B/U sotuvlar tarixi" jadvali — alohida oy filtriga ega
- Global davr filtri (sahifa tepasidagi `period`) ham shu tabga ta'sir qiladi; lokal filtrlar shu natija ustiga qo'shimcha filtr sifatida ishlaydi

## Customers.jsx — Tayyor xususiyatlar
- Qo'shish / tahrirlash / o'chirish
- phone2 — jadval, profil, forma, qidiruvda
- Merge modal, phone collision detection
- mergeCustomers() mock.js da
- Qarz kolonnasi, pagination (20/sahifa)
- birthDate / instagram profil modalida

## Expenses.jsx — Tayyor xususiyatlar
- Do'kon xarajatlari: CRUD, oy filtri, kategoriya, qidiruv, valyuta filtri, pagination
- Yetkazib beruvchi to'lovlari: readonly, pagination, do'kon filtri
- Kapital harakati: CRUD, oy filtri, pagination

## Keyingi session
Management.jsx — yoki foydalanuvchi belgilaydi.

## Eslatmalar
- `.claude/settings.local.json` da `"cockroachdb": false` — hook xatosi chiqmaydi
- Multido'kon qo'shilganda filterShop global headerga ko'chirilsin (Expenses, shopStore.js)
