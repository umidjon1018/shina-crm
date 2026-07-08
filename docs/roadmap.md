# Deployment & Tijoratlashtirish Yo'l Xaritasi

## Bosqich 1 — Frontend tugatish (hozirgi, ~70%)
Davom etmoqda. Backend/SaaS haqida hozircha qadam tashlanmaydi.

## Bosqich 2 — PWA ✅ BAJARILDI (2026-06-07)
- vite-plugin-pwa o'rnatildi
- manifest, sw.js, ikonlar (192/512/maskable) tayyor
- Termal printer cheklovi: brauzer raw TCP ocholmaydi
  → WiFi printer kerak bo'lsa Capacitor bilan native qobiq
  → Bluetooth uchun Web Bluetooth API variant

## Bosqich 3 — White-label modeli
- Har mijoz uchun alohida build (companyName/Logo/narxlar)
- Bitta hosting, subdomain (mijoz1.brend.uz)
- Ma'lumotlar izolyatsiyasi: mock.js+localStorage — har nusxa mustaqil
- AI Agent: har mijoz o'z API kalitini kiritadi

## Bosqich 4 — SaaS (multi-tenant) — talab tasdiqlangandan keyin
- Backend + PostgreSQL, mock.js → server API
- tenantId har yozuvda
- Click/Payme obuna tizimi
- Taxminiy infra narxi: $15-60/oy

## Backend qo'shilganda MAJBURIY qoidalar
- WebSocket/SSE albatta qo'shilsin (real-vaqt: permissions, bildirishnomalar, savdo)
- Sessiya nazorati: xodim faqat 1 qurilmadan, Admin cheklovsiz
  → server: activeSessionDeviceId, yangi login → eski token invalidate → WSS signal
