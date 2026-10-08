# SICRM — to'liq tahlil va qayta tuzish rejasi (2026-10-08, 2-versiya)

1-versiya: tahlil. 2-versiya: foydalanuvchi qarorlari (10-bo'lim) + UI, mijoz profili, ulgurji savdo, bosh sahifa diagrammalari rejalari + tekshiruv natijalari.

---

## 0. Qisqa xulosa

1. **Bir nechta funksiya bitta qurilmadan tashqariga chiqmaydi** (chegirma so'rovi, ogohlantirishlar, komplektlar, savdo sozlamalari, audit) — faqat brauzer xotirasida. Xodimlar telefonda, admin kompyuterda ishlaganda bular amalda ishlamaydi.
2. **Tuzilma tarqoq:** 12 menyu, 66 tab, foyda 7 joyda 3–4 formulada, sozlamalar 6 joyda → **10 menyu, ~39 tab**.
3. **Eski hisobot tablari hamma ma'lumotni telefonga yuklab hisoblaydi.**
4. **Server narx va chegirma chegarasini tekshirmaydi.**
5. **UI zich va mayda:** 9–11 px yozuv 656 marta, 12 px — 1638 marta; 83 ta alohida yozilgan modal, umumiy modal komponenti yo'q.

---

## 1. Hozirgi xarita

| Menyu | Tablar | Eng katta fayllar |
|---|---|---|
| Bosh sahifa | — | Dashboard 213 + DashboardSummary 169 |
| Ombor | 6: Qoldiq, B/U qoldiq, Kirim, Barkod, Inventarizatsiya, Hisobdan chiqarish | BarcodeTab 1451, StockTab 996 |
| Sotuv | 8: Yangi sotuv, B/U sotuv, Bronlar, Bekor qilish, Sotuv tarixi, Bekor tarixi, Muddatli to'lov, Foyda | useSalesState **1877**, NewSaleTab 766 |
| Mijozlar | — (profil oynasida 8 tab) | index 793, ProfileModal 680 |
| Marketing | 6: Aksiyalar, Promokodlar, Sertifikatlar, Telegram xabarlar, Tug'ilgan kunlar, Sozlamalar | |
| Kirim | 7: Kirimlar, Yetkazib beruvchilar, Qarzlar, Buyurtmalar, Hisob-kitob, To'lovlar tarixi, Qaytarish | index **1802** |
| Moliya | 7: Xarajatlar, Daromadlar, Pul harakati, Foyda va zarar, Yetk. to'lovlari, Kapital, Kategoriyalar | |
| Hisobotlar | **12**: Sotuv, Tovarlar, Qoldiq, Ombor harakati, Kirim, Mijozlar, Segmentlar, Xodimlar, Do'konlar, Moliya, B/U, Foyda | index **1948**, SalesTab **1813** |
| Integratsiyalar | 4: API, Telegram botda qoldiq, UDS, To'lov tizimlari | |
| AI Agent | 4: Kunlik tahlil, AI yordamchi, Statistika, Instagram | |
| Boshqaruv | 6: Ogohlantirishlar, Tovarlar, Xodimlar, Chegirmalar, Komplektlar, Sozlamalar | index **1705**, ProductsTab **1894** |
| Admin | 6: Xodimlar, Qurilmalar, Audit, Do'konlar, AI agentlar, Sozlamalar | |

---

## 2. 🔴 Ma'lumot faqat bitta qurilmada (localStorage)

| # | Funksiya | Oqibat |
|---|---|---|
| 1 | **Chegirma so'rovi** | So'rov sotuvchining o'z telefonida qoladi — boshqaruvchi ko'rmaydi |
| 2 | **Ogohlantirishlar** (barkodsiz/mijozsiz sotuv, tovar tugadi, qayta chop) | Har qurilma faqat o'zinikini ko'radi |
| 3 | **Komplektlar** (`bundleService.js` — localStorage) | Admin yaratgan komplekt sotuvchi kassasida yo'q; hisobotlar ham shu mahalliy ro'yxatga tayanadi |
| 4 | **Savdo sozlamalari:** USD kursi, nasiya tashkilotlari, manbalar, chegirma chegaralari, oylik rejalar, ogohlantirish sozlamalari, atributlar, narxnoma, menyu nomlari, yashirin sahifalar | Telefonlarda standart qiymat qoladi |
| 5 | **Audit jurnali** | Admin faqat o'z brauzeridagi amallarni ko'radi |
| 6 | **Boshqaruvchi xodimni tahrirlashi** | Server 403 qaytaradi, xato yashirinadi. Bloklash/tahrir tarixi/o'chirish so'rovi ham localStorage |
| 7 | **AI sozlamalari** (provayder, model, limit, yoqish) | Hech narsaga ta'sir qilmaydi |
| 8 | "Ishonchli qurilmalar" ro'yxati | Eski, ma'nosiz |
| 9 | Marketing yo'l xaritasi | Bitta qurilmada |

## 3. 🟠 Server nazorati va hisob-kitob

1. **Narx va chegirma nazorati faqat brauzerda** — server minimal narx va rol chegarasini tekshirmaydi.
2. **Foyda 3–4 formulada** (brauzer keshbekni ayirmaydi; P&L, bosh sahifa, AI — alohida SQL).
3. **Sotuv → Foyda tabi kirim narxi yo'q bo'lsa uni sotuv narxining 80% deb "o'ylab topadi"** (`purchasePrice || price * 0.8`) — foyda soxta raqam bo'lib chiqadi. *(2-versiyada topildi)*
4. Sotuvchi API orqali boshqa do'kon sotuvlarini olishi mumkin.
5. Sotuvchi xarajat va kapitalni o'qiy oladi.
6. B/U olingan narx yashirilmaydi.
7. Uch xil "standart rol" ro'yxati (ikkitasi o'lik).
8. `ExpenseFormModal` kursi `12700` qattiq yozilgan.
9. Xodim "o'chirish so'rovi"da bo'lsa, server uni darhol bloklaydi (`pending_delete = FALSE` sharti) — "admin tasdiqlaguncha faol qoladi" degan izohga zid.

## 4. Tarqoq mavzular

| Mavzu | Hozir (joylar soni) | Yangi joy |
|---|---|---|
| Foyda | 7 | Moliya → Foyda (yangi ko'rinish, 7-bo'lim) |
| Savdo KPI | 5 | Bosh sahifa (qisqa) + Hisobotlar → Savdo; AI → Statistika o'z joyida qoladi |
| Yetkazib beruvchi qarzi | 7 | Kirim → Qarz va to'lovlar + Moliya → Qarzlar |
| Yetk. to'lovlari tarixi | 2 (turli manba) | Kirim → Qarz va to'lovlar |
| Mijoz qarzi | 5 | Sotuv → Nasiyalar + Moliya → Qarzlar + mijoz profili |
| Qoldiq / kam qolgan | 6 | Ombor → Qoldiq + Hisobotlar → Ombor |
| Pul harakati / kapital | 3 | Moliya |
| Xodim samaradorligi | 4 | Hisobotlar → Xodimlar |
| Xodimlarni boshqarish | 2 | Sozlamalar → Xodimlar |
| Kirim formasi | 3 joy, 2 xil forma | Bitta umumiy forma, ikki joyda (qaror 2) |
| Barkod | 2 | Ombor → Barkod |
| Tovar katalogi | 2 | Ombor → Tovarlar |
| Chegirmalar | 5 | Marketing (Aksiyalar + komplekt, Kodlar, Sodiqlik); chegirma chegarasi → Sozlamalar |
| Telegram | 5 | Ulanish → Sozlamalar → Integratsiyalar; xabarlar → Marketing |
| Instagram | 2 | Ulanish → Sozlamalar → Integratsiyalar; suhbatlar → AI |
| Sozlamalar | 6 | Bitta Sozlamalar sahifasi |
| Sana filtri | 2 xil | Hamma joyda `PeriodPicker` |

---

## 5. Yangi tuzilma

**Menyu (10):** Bosh sahifa · Sotuv · Ombor · Kirim · **Ulgurji** (yangi, 9-bo'lim) · Mijozlar · Marketing · Moliya · Hisobotlar · AI · Sozlamalar
`[A | B]` — tab ichidagi almashtirgich.

| Sahifa | Yangi tablar |
|---|---|
| **Sotuv** (8→5) | Kassa `[Yangi \| B/U]` · Bronlar · Qaytarish · Tarix `[Sotuvlar \| Bekorlar]` · Nasiyalar |
| **Ombor** (6→5) | Qoldiq `[Yangi \| B/U]` · Tovarlar (Boshqaruvdan) · Kirim (umumiy forma) · Barkod (+qayta chop ruxsati) · Nazorat `[Inventarizatsiya \| Hisobdan chiqarish]` |
| **Kirim** (7→4) | Kirimlar `[Kirimlar \| Buyurtmalar]` (+Excel, umumiy forma) · Yetkazib beruvchilar (profilda akt sverka) · Qarz va to'lovlar · Qaytarish |
| **Marketing** (6→4) | Aksiyalar (+ "Komplekt" turi) · Kodlar `[Promokodlar \| Sertifikatlar]` · Sodiqlik (Boshqaruvdan) · Xabarlar `[Telegram \| Tug'ilgan kunlar]` |
| **Moliya** (7→5) | Xarajat va daromad · Pul harakati · Foyda (yangi ko'rinish, P&L shu yerda) · Qarzlar (debitor + kreditor) · Kapital |
| **Hisobotlar** (12→5) | Savdo `[Umumiy \| Tovarlar \| Do'konlar]` · Ombor `[Qoldiq \| Harakat \| B/U]` · Mijozlar `[Tahlil \| Segmentlar]` · Xodimlar · Yetkazib beruvchilar |
| **AI** (4 — o'zgarmaydi) | Kunlik tahlil · Yordamchi · Statistika (qaror 7: o'z joyida) · Mijozlar boti (Instagram) |
| **Sozlamalar** (yangi) | Kompaniya* · Do'konlar* · Xodimlar `[Xodimlar \| Rollar* \| Qurilmalar]` · Savdo qoidalari · Bildirishnomalar · AI agentlar* · Integratsiyalar* · Audit* |

\* — **faqat admin**. Qolganlari rol ruxsati bilan (qaror 1): boshqaruvchi admin bo'limlari va ma'lumotlarini ko'rmaydi — na menyuda, na API'da.

**Bildirishnomalar** — yuqori panelda qo'ng'iroqcha (server + real vaqt), chegirma so'rovini shu yerdan tasdiqlash.

---

## 6. UI soddalashtirish rejasi (11-band)

**Muammo:** sahifa ochilganda hamma narsa birdan ko'rinadi — 6–14 ustunli jadvallar, 9–11 px yozuvlar, har sahifada 5–8 ta statistika kartasi, filtrlar doim ochiq.

**Tamoyil — "avval muhim, keyin to'liq":**
1. **Sahifa = 3 qism:** sarlavha + 3–4 ta asosiy KPI → qisqa ro'yxat (4–5 ustun) → qator bosilsa **modal**da to'liq ma'lumot.
2. **Modal ichida modal** (stack): masalan, mijoz → sotuv → tovar. "Orqaga" tugmasi va telefon "orqaga" tugmasi faqat yuqoridagi modalni yopadi.
3. **Yozuv o'lchami:** asosiy matn 14 px (telefonda ham), ikkinchi darajali 12 px, 9–11 px faqat belgi/badge'larda. Raqamlar katta va qalin.
4. **Filtrlar yashirin:** "Filtr" tugmasi → pastdan chiquvchi panel (telefon) yoki modal. Faol filtrlar chip ko'rinishida.
5. **Telefonda jadval → karta** (har qator — kichik karta: nom, asosiy raqam, holat).
6. **Bitta davr tanlagich** (`PeriodPicker`) hamma joyda.

**Umumiy komponentlar to'plami** (birinchi qadam, `src/components/ui/`):
`PageHeader`, `KpiStrip`, `DataTable` (saralash, sahifalash, qator bosish, telefonda karta), `Modal` + `ModalStack` (ichma-ich, orqaga tugmasi bilan), `FilterSheet`, `DetailRow`/`DetailGrid`, `EmptyState`, `Badge`, `formatPrice`/`formatDate` (`src/utils/format.js`).

**Tartib:** komponentlar → Mijozlar (namuna sahifa, 8-bo'lim) → Sotuv → Ombor → Kirim → Moliya → Hisobotlar → Marketing → Sozlamalar. Har sahifa tablari birlashtirilayotganda bir yo'la yangi UI ga o'tkaziladi (ikki marta qilinmaydi).

---

## 7. Yangi foyda ko'rinishi (3-qaror)

Hozirgi Sotuv → Foyda jadvalidagi **barcha ustunlar saqlanadi** (sana, tovar, barkod, kategoriya, mijoz, xodim, kirim summasi, sotuv summasi, soni, to'lov turi, holat, komissiya, marja, foyda) + boshqa joylardagi foyda ma'lumotlari (xarajatlar, sof foyda, dinamika, kategoriya taqsimoti).

**Moliya → Foyda:**
1. **Yuqorida:** davr tanlagich + 4 KPI — Tushum, Yalpi foyda, Xarajatlar, Sof foyda (oldingi davr bilan solishtirish).
2. **Diagramma:** kunlar bo'yicha tushum/foyda.
3. **Ixcham ro'yxat** `[Tovarlar | Sotuvlar | Kategoriyalar | P&L]`:
   - *Tovarlar:* tovar · sotilgan soni · tushum · foyda · marja %. **Bosilsa — tovar modali**: shu davrdagi har bir sotuvi (sana, barkod, mijoz, xodim, kirim/sotuv narxi, to'lov turi, nasiya holati, komissiya, foyda), o'rtacha kirim narxi, partiyalar bo'yicha tannarx, qoldiq.
   - *Sotuvlar:* chek · sana · mijoz · summa · foyda. Bosilsa — chek modali (hamma ustunlar).
   - *Kategoriyalar:* kategoriya · tushum · foyda · ulush.
   - *P&L:* hozirgi Foyda va zarar jadvali (o'zgarmaydi).
4. Hammasi **serverda** hisoblanadi, bitta formula: `sof tushum − tannarx − nasiya komissiyasi − keshbek`; kirim narxi yo'q tovar "narx kiritilmagan" deb belgilanadi (80% taxmin olib tashlanadi).
5. Sotuv → Foyda va Hisobotlar → Foyda tablari olib tashlanadi; `sales.profit` / `reports.profit` ruxsati yangi tabga o'tkaziladi.

---

## 8. Mijoz profili modali (12-band)

Mijozlar ro'yxati ixcham: ism · telefon · qarz · daraja · oxirgi xarid. **Bosilsa — profil modali**, hamma narsa bitta joyda:

- **Yuqori qism (doim ko'rinadi):** ism, telefon(lar), daraja, balans, umumiy xarid, qarz, oxirgi tashrif; tezkor tugmalar: Qo'ng'iroq, Telegram, Qarz to'lash, Tahrirlash.
- **Tablar (5):** Umumiy (ma'lumot + afzalliklar + guruh/teglar) · Xaridlar `[Yangi | B/U]` · Moliya `[Nasiya | Balans/keshbek]` · Izohlar · Telegram.
- **Ichma-ich modal:** xarid qatori → chek modali → tovar modali; nasiya → to'lov jadvali modali.
- Ma'lumot bitta so'rov bilan serverdan (`GET /api/customers/:id/profile`), hozirgidek hamma sotuvlarni yuklab filtrlash emas.

---

## 9. Ulgurji savdo bo'limi (13-band)

**Maqsad:** biznes egasi boshqa do'konlarga ulgurji narxda tovar beradi. Yetkazib berish yo'q — mijoz o'zi olib ketadi, shuning uchun logistika moduli kerak emas.

**Menyu: "Ulgurji"** — tablar:
1. **Hujjatlar** (nakladnoylar): yangi hujjat → mijoz (do'kon) tanlanadi → tovarlar: barkod skaner **yoki** tovar + soni (tizim do'kon qoldig'idan FIFO bo'yicha itemlarni o'zi tanlaydi) → ulgurji narx avtomatik → chegirma → to'lov (naqd/o'tkazma/qarzga) → chop etish (nakladnoy PDF). Holatlar: qoralama → berildi → to'langan/qisman.
2. **Mijozlar** (ulgurji): do'kon nomi, mas'ul shaxs, telefon, INN, manzil, **kredit limiti**, to'lov muddati (kun), narx guruhi.
3. **Qarzlar va to'lovlar:** har mijozning qarzi, muddati o'tganlar, to'lov qabul qilish (FIFO — eng eski hujjatdan), **akt sverka** (Kirimdagi yetkazib beruvchi akt sverkasining teskarisi).
4. **Qaytarish:** hujjat bo'yicha qaytarish → itemlar omborga qaytadi, qarz kamayadi.

**Narx:** tovarda yangi maydon `wholesale_price` (ulgurji narx) + ixtiyoriy narx guruhlari (masalan, "Doimiy diler −3%").
**Ma'lumotlar bazasi:** `wholesale_clients`, `wholesale_docs`, `wholesale_doc_items` (item_id, narx, tannarx nusxasi), `wholesale_payments`, `wholesale_returns`. Itemlar `sold` holatiga o'tadi (`sold_at`), kanal belgisi bilan.
**Hisobotlarga ulanish:** Moliya → Foyda va Pul harakati (ulgurji alohida qator), Moliya → Qarzlar (debitorlikda ulgurji mijozlar), Hisobotlar → Savdo (`[Chakana | Ulgurji]` filtri), AI tahlil (alohida bo'lim).
**Ruxsatlar:** `wholesale.docs`, `wholesale.clients`, `wholesale.debts`, `wholesale.returns`; ulgurji narx va tannarx — `canSeeCost`.

**Savollar (ulgurji):**
- U1. Konsignatsiya kerakmi (tovar beriladi, sotilgach to'lanadi, sotilmagani qaytadi)?
- U2. Ulgurji narx: har tovarga bitta narx yetarlimi yoki har mijoz/guruhga alohida narx kerakmi?
- U3. Ulgurji sotuvni kim qiladi — faqat admin/boshqaruvchimi yoki sotuvchiga ham ruxsat beriladimi?
- U4. Ulgurji tovar qaysi do'kon qoldig'idan chiqadi — tanlangan do'kondanmi yoki alohida "ulgurji ombor" kerakmi?

---

## 10. Qarorlar (2026-10-08)

| # | Savol | Qaror |
|---|---|---|
| 1 | Bitta Sozlamalar sahifasi | **Ha.** Faqat rol ruxsati ishlaydi; boshqaruvchi admin tablari va ma'lumotlarini ko'rmaydi |
| 2 | Kirim formasi | **B** — ikki joyda qoladi, bitta umumiy forma |
| 3 | Foyda | Ko'chirish mumkin. Barcha ustunlar saqlanadi → yangi ko'rinish: ixcham ro'yxat + tovar modali (7-bo'lim) |
| 4 | Boshqaruvchi xodimni tahrirlaydi | **A** — ha (serverda ruxsat), o'chirish admin tasdig'i bilan |
| 5 | Chegirma so'rovi | Boshqaruvchiga real vaqtda boradi, u tasdiqlaydi |
| 6 | Minimal narx | Sotuvchi savdolashib tushira oladigan **eng past chegara**. Aksiya va maxsus chegirmalarga taalluqli emas — ular birinchi aytilgan narxdan (`cash_price`) ayriladi |
| 7 | AI → Statistika | **O'z joyida qoladi** (alohida bo'lim, bosh sahifani chalg'itmasin) |
| 8 | Komplekt → Aksiyalar | **Ha** |
| 9 | Qachon | **Hozir**, hammasi. Kerak bo'lsa test oyi to'xtatiladi |

**Minimal narx qoidasi (6-qaror) — serverda:**
- Har sotuv qatorida `base_price` (aksiyadan oldingi narx) saqlanadi.
- Sotuvchi uchun: `base_price ≥ min_sale_price` (nasiyada `installment_base_price`) va qo'lda berilgan foizli chegirmadan keyin ham shu chegaradan past emas. Chegara faqat **boshqaruvchi tasdiqlagan chegirma so'rovi** bilan o'tiladi.
- Aksiya, komplekt, sodiqlik, promokod, sertifikat chegirmalari `cash_price` dan hisoblanadi va minimal narx chegarasiga tushmaydi.
- Qo'lda foizli chegirma: rol chegarasidan (sozlamadagi 5%/10%) oshsa — tasdiqlangan so'rov talab qilinadi.

---

## 11. Bosh sahifa diagrammalari (14-band)

Hozir: tushum maydon-diagrammasi + to'lov turlari doira-diagrammasi + ro'yxatlar. Qo'shiladi (hammasi serverdan, davr tanlagichga bog'liq):
1. **Tushum va foyda** — kunlar bo'yicha ustun + chiziq (foyda ruxsati bo'lsa).
2. **Kategoriyalar ulushi** — doira (shina/disk/aksessuar...).
3. **Top-5 tovar** — gorizontal ustunlar (hozirgi ro'yxat o'rniga).
4. **Do'konlar solishtiruvi** — ustunlar (bir nechta do'kon bo'lsa).
5. **Soatlar bo'yicha savdo** — qaysi soatda xaridor ko'p (ustun).
6. **Qarzlar** — mijozlar bizga / biz yetkazib beruvchilarga / ulgurji mijozlar (yonma-yon ustunlar).
7. **Qoldiq qiymati kategoriyalar bo'yicha** (ruxsat bo'lsa).

Diagrammalar ixcham: telefonda bittadan, kompyuterda 2–3 ustunda; bosilsa — tegishli hisobot sahifasiga o'tadi.

---

## 12. Tezlik va kod sifati (o'zgarmagan, qisqa)

- `getSales()` barcha sotuvlarni itemlari bilan qaytaradi, 5 sahifada; Hisobotlar 11 ta to'liq ro'yxat; Boshqaruv har tab almashganda 6 ta ro'yxat.
- **O'lchov (lokal):** 1 sotuv ≈ 1,75 KB, 1 item ≈ 0,5 KB. Hisobotlar sahifasi hozir ~340 KB; 1 yildan keyin (~3000 sotuv, ~10 000 item) **~10 MB** har ochilganda.
- Katta fayllar: `useSalesState` 1877, `Management/index` 1705, `Income/index` 1802, `Reports/index` 1948.
- Takrorlar: `formatPrice` 15 faylda, `Pagination` 15, 83 ta modal, 82 ta jadval.
- 89 ta jim `catch {}`; `MOCK_*` nomlari 428 marta.
- O'lik kod: `config/credentials.js` (demo parollar), `constants/calendar.js`, `higgsfieldService.js`, `higgsfieldController.js`, Boshqaruvdagi promo holati, eski ruxsat tizimi, ~800 ehtimoliy ishlatilmagan tarjima kaliti.
- Backend: migratsiyalar 17 faylda (multi-tenant uchun to'siq), `aiController` 1655 qator.

---

## 13. Bosqichli reja (yangilangan)

| Bosqich | Nima |
|---|---|
| **0. Xatolar** | Server: savdo sozlamalari, bildirishnomalar + real vaqt chegirma so'rovi, audit, komplekt → aksiya turi, boshqaruvchi xodim tahriri, minimal narx/chegirma nazorati, do'kon chegarasi, foyda 80% taxminini olib tashlash, o'lik AI sozlamalari |
| **1. UI asos + Sozlamalar** | Umumiy UI komponentlari; Sozlamalar sahifasi (Boshqaruv + Admin + Integratsiyalar), yangi ruxsat daraxti va eski ruxsatlarni ko'chirish; bildirishnoma qo'ng'iroqchasi; Tovarlar → Ombor; Sodiqlik → Marketing |
| **2. Ish sahifalari** | Mijozlar (profil modali) → Sotuv → Ombor → Kirim (umumiy forma) → Marketing → Moliya (yangi Foyda, Qarzlar) — tablar birlashtiriladi va yangi UI ga o'tadi; `useSalesState` bo'linadi |
| **3. Hisobotlar + Bosh sahifa** | Eski hisoblar serverga, 12→5 tab, yagona formula, diagrammalar, sahifalash |
| **4. Ulgurji savdo** | 9-bo'lim (U1–U4 javoblaridan keyin) |
| **5. Tozalash** | O'lik kod, tarjimalar, migratsiyalarni yig'ish, `aiController` bo'lish, til bo'lagini ajratish |

Har qadamdan keyin: build, lokal sinov (3 rol: admin, boshqaruvchi, sotuvchi), commit. Deploy — faqat foydalanuvchi aytganda.

---

## 14. Tekshiruv natijalari (2026-10-08)

- ✅ Lokal backend + `dist-local` ishga tushirildi; admin sifatida **12 sahifa ochildi — konsolda xato yo'q**.
- ✅ Ro'yxat so'rovlari o'lchandi (12-bo'lim).
- ✅ 2-bo'limdagi xatolar kod orqali tasdiqlangan (saqlash joyi va server route'lari).
- ⛔ **Server bazasi hajmi** — avtomatik rejim server bazasiga ulanishni rad etdi ("Production Reads"). Hal qilish: foydalanuvchi ruxsat beradi yoki buyruqni o'zi ishga tushiradi.

---

## 15. Bajarilganlar (lokal, deploy qilinmagan)

### Bosqich 0 ✅ (2026-10-08)
| Band | Natija | Commit (frontend / backend) |
|---|---|---|
| Savdo sozlamalari serverda | `app_settings.business` (kurs, manbalar, nasiya tashkilotlari, chegirma chegaralari, rejalar, ogohlantirish sozlamalari, atributlar, narxnoma, menyu nomlari, yashirin sahifalar, xodim tahrir qulfi); kalit bo'yicha ruxsat; SSE `settings_changed`; birinchi kirishda admin/boshqaruvchi qurilmasidagi o'zgartirilgan qiymat serverga ko'chadi. Kategoriya aylanish muddati serverda | 1e7ff335 / 6ddf4bb |
| Bildirishnomalar serverda | `notifications` + `notification_reads`; chegirma so'rovi boshqaruvchiga real vaqtda, tasdiq sotuvchiga qaytadi; kim tasdiqlashini server belgilaydi; tasdiq bir marta ishlatiladi | 97cc6a73 / bb5dfbd |
| Audit serverda | `audit_log`; sotuv bekor/tahrir, narx o'zgarishi, xodim, qurilma, do'kon, sozlamalar, chegirma tasdig'i — server yozadi; Admin → Audit serverdan | 3222744e / 5a44a35 |
| Xodimlar (4A) | boshqaruvchi o'zidan past lavozimni boshqaradi, rol/ruxsatni o'zgartirmaydi, bo'shatish — so'rov + admin tasdig'i (so'rovda turgan xodim ishlaydi); bloklash serverda (`is_blocked`); admin tahrir qulfi; xodim parollari brauzerda saqlanmaydi | 3222744e / 5a44a35 |
| Komplekt → Aksiya (8) | `promotions.bundle_items`, "Komplekt" turi; kassada aksiya mexanizmi to'liq to'plamga chegirma beradi (cash_price dan); eski mahalliy komplektlar avtomatik ko'chiriladi; Boshqaruv → Komplektlar olib tashlandi | 1202c3ca / 4470f76 |
| Minimal narx (6) | serverda: sotuvchi savdolashib/qo'lda chegirma bilan min narxdan pastga tusha olmaydi (faqat tasdiqlangan so'rov bilan); rol chegarasi (sotuvchi 5%, boshqaruvchi 10%) serverda; aksiya/komplekt/sodiqlik chegaraga tushmaydi; `sale_items` uchun `base_price` | 1202c3ca / 4470f76 |
| Xavfsizlik | AI kaliti serverda shifrlangan; do'konga biriktirilgan xodim faqat o'z do'koni sotuvlari; xarajat/kapital ro'yxati ruxsat bilan | 20550789 / 13b1e7d |
| Tozalash | o'lik AI sozlamalari, Boshqaruvdagi takror AI kaliti, "ishonchli qurilmalar", mahalliy Face ID, 80% tannarx taxmini | 20550789 |

**Deploy eslatmalari (Bosqich 0):** yangi jadvallar va ustunlar avtomatik yaratiladi (`notifications`, `notification_reads`, `audit_log`, `employees.is_blocked/blocked_by_admin`, `product_categories.turnover_days`, `promotions.bundle_items`). `middleware/auth.js`, `utils/tokens.js`, `authController` dagi xodim sharti `pending_delete = FALSE` → `is_blocked IS NOT TRUE` ga o'zgardi (bo'shatish so'rovidagi xodim admin tasdiqlaguncha ishlaydi). Deploydan keyin admin bir marta ilovaga kirishi kerak — uning brauzeridagi sozlamalar (kurs, nasiya tashkilotlari...) serverga ko'chadi. Keyin Sozlamalarni tekshirish.

### Bosqich 1 ✅ (2026-10-08)
- Yagona **Sozlamalar** (`/settings`): Kompaniya*, Do'konlar*, Xodimlar, Qurilmalar, Savdo qoidalari, Bildirishnomalar, AI agentlar*, Integratsiyalar*, Audit* (* — faqat admin). Boshqaruvchi faqat ruxsat berilgan bo'limlarni ko'radi (lokal sinov: 4 bo'lim).
- Ruxsat daraxti: `settings.*`, `notifications`, `warehouse.products`, `marketing.loyalty`; eski `management.*`/`integrations.*` serverda bir martalik ko'chiriladi (`utils/permMigrate.js`, belgi `app_settings.perm_tree_v2`).
- Bildirishnoma qo'ng'iroqchasi (yuqorida) — chegirma so'rovlari va ogohlantirishlar.
- Ombor → **Tovarlar** (katalog, narx, kategoriya, atribut, qayta chop ruxsati); Marketing → **Sodiqlik**.
- `/management`, `/admin`, `/integrations` → `/settings` ga yo'naltiriladi. Boshqaruv, Admin Panel, Integratsiyalar sahifalari o'chirildi.
- Commitlar: frontend c7251363, backend 16773fc.
- Qoldi (Bosqich 2 da): Telegram bot sozlamalarini Marketingdan Integratsiyalarga ko'chirish; xodim samaradorligi oynasi (Boshqaruvdagi) → Hisobotlar → Xodimlar.
