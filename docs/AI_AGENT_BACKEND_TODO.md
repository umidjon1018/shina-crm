# AI Agent — Backend bog'liq vazifalar (TODO, hozir bajarilmaydi)

Bu fayl — `AI_AGENT_REBUILD_SPEC.md` asosida frontend qurilgandan keyin, backend (Fastify +
PostgreSQL + Claude API) qo'shilganda bajariladigan ishlarning to'liq ro'yxati. Hozirgi bosqichda
bu yerdagi hech narsa amalga oshirilmaydi — faqat frontendda shu joylar uchun "joy tayyor"
qilib qo'yiladi (masalan tugma bor, lekin bosilganda "ulanish kerak" degan demo xabar chiqadi).

Foydalanuvchining original talabi (so'zma-so'z, 2026-yil iyun) to'rt agent bo'yicha berilgan edi.
Quyida har bir band va uning bajarilish holati ko'rsatilgan.

---

## 1. Savdo agenti

| Talab | Hozirgi bosqich | Backend bosqichida |
|---|---|---|
| Sotuv/kirim-narx solishtirish, marja hisobi | ✅ To'liq (mock-data, real hisob) | — |
| Moliyaviy holatni nazorat qilish (dashboard) | ✅ To'liq | — |
| "To'g'ri qarorlar va yechimlar topish" (AI xulosa) | ⚠️ Qisman — qoida-asosidagi shablon xulosalar | Claude API orqali real-vaqt, ma'lumotlarga asoslangan erkin matn generatsiyasi. System prompt: "Siz Shina va Diska do'konining Bosh Moliyaviy Direktorisiz..." (asl arxitektura hujjatida berilgan). |
| Chat orqali savol-javob | ⚠️ Qisman — kalit so'z bo'yicha statik javoblar | Claude API'ga real chat, kontekstga (joriy moliyaviy ma'lumotlar) ega bo'lgan suhbat. `chat_messages` jadvali kerak (TradeLog Pro'dagi kabi sessiyaga bog'langan tarix). |
| Avtomatik oylik/haftalik hisobot generatsiyasi | ❌ Yo'q | BullMQ scheduler + `generate_excel_report()` tool (asl hujjatda ko'rsatilgan). |
| Pul oqimi inqirozi haqida ogohlantirish | ❌ Yo'q | `alert_admin_low_margin()` tool, real vaqt monitoring. |

## 2. PR/Marketing agenti

| Talab | Hozirgi bosqich | Backend bosqichida |
|---|---|---|
| Tovar ma'lumotlaridan kontent g'oyasi chiqarish | ✅ To'liq (qoida-asosida, Activity Feed signal orqali) | Claude API orqali, signalga qarab haqiqiy ssenariy/post matni generatsiyasi (UZ/RU). |
| Higgsfield MCP ulash | ❌ Yo'q, faqat UI tugmasi | Haqiqiy Higgsfield MCP server ulanishi, `generate_video_prompt_for_higgsfield()` tool. Foydalanuvchi MCP URL/kalitini kiritishi kerak bo'ladi. |
| Video tayyorlash | ❌ Yo'q | Higgsfield API orqali real video generatsiya. |
| Instagramga avtomatik joylash | ❌ Yo'q | Instagram Graph API integratsiyasi, `schedule_instagram_post()` tool, OAuth ulanish. |
| Kontent kalendari (rejalashtirish) | ✅ To'liq (mock ro'yxat) | Backend'da saqlanadigan, real rejalashtiriladigan kalendar (Postgres jadval). |

## 3. Mijoz muloqoti agenti

| Talab | Hozirgi bosqich | Backend bosqichida |
|---|---|---|
| Instagram comment'larga avtomatik javob | ❌ Yo'q | Instagram webhook + Claude API, `search_products_by_size()` tool. |
| Direct'ga chorlash va sotishgacha suhbat | ❌ Yo'q | Instagram DM API + Claude agentic suhbat oqimi. |
| Mijozga mashina modeliga mos shina taklif qilish | ⚠️ Qisman — mock suhbatda statik ko'rinish | Real vaqtda baza qidiruvi (`search_products_by_size()`) + Claude javob generatsiyasi. |
| Tug'ilgan kun/bayram tabriklari | ⚠️ Qisman — ro'yxat ko'rinadi, "yuborish" demo | Haqiqiy SMS/Instagram orqali avtomatik yuborish (`send_sms_via_eskiz()` — asl hujjatda ko'rsatilgan), BullMQ kunlik scheduler bilan. |
| Xarid xulqiga qarab segmentatsiya + aksiya xabari | ⚠️ Qisman — mock tahlil, "yuborish" demo | Real mijozlar bazasidan dinamik segmentatsiya, avtomatik xabar yuborish. |
| Mavsum oldidan barcha mijozlarni ogohlantirish | ⚠️ Qisman — ro'yxat ko'rinadi, real yuborilmaydi | Ommaviy SMS/Instagram xabar yuborish tooli. |
| Instagram orqali bron qilish, vaqtini aytish, Tovar bazasi agentini xabardor qilish | ✅ To'liq demo sifatida (ichki Activity Feed orqali, Instagram'siz) | Haqiqiy Instagram suhbatidan kelib chiqadigan bron — `create_booking()` tool, Postgres `Booking` jadvaliga yozish, real bildirishnoma. |

## 4. Tovar bazasi agenti

| Talab | Hozirgi bosqich | Backend bosqichida |
|---|---|---|
| To'liq tovar aylanmasini nazorat | ✅ To'liq (mock-data, real hisob) | — (real ma'lumot Postgresdan keladi, mantiq o'zgarmaydi) |
| Yaxshi sotilayotganga buyurtma ogohlantirish | ✅ To'liq (qoida-asosida) | — |
| Yomon sotilib kam qolgan/tugaganga buyurtma kerak-kerakmasligi | ✅ To'liq (qoida-asosida, mavsum mantig'i bilan) | — |
| Mavsumga moslik tahlili | ✅ To'liq (sodda kalendar qoida) | Kelajakda Claude API bilan murakkabroq tahlil (masalan ob-havo ma'lumotlari bilan birga) mumkin, lekin shart emas. |
| Avtomatik soatlik monitoring | ❌ Yo'q (foydalanuvchi sahifani ochganda hisoblanadi) | BullMQ scheduler, `check_stock_levels()` tool, soatlik avtomatik tekshirish + `AgentLog`ga yozish. |
| Ta'minotchiga real buyurtma yuborish | ❌ Yo'q, faqat "Tasdiqlash" demo tugmasi | Real ta'minotchi integratsiyasi (email/SMS/PDF shartnoma — asl hujjatda "PDF Shartnoma Tuzish" tugmasi ko'rsatilgan). |

---

## Umumiy backend talablari (bosqich boshlanganda kerak bo'ladigan narsalar)

- **Backend stack**: Fastify + PostgreSQL (Prisma) — asl arxitektura hujjatida to'liq schema
  berilgan (`Product`, `Client`, `Booking`, `Order`, `SaleItem`, `AgentLog`).
- **Scheduler**: BullMQ — har agentning "avtonom" ishlashi uchun (soatlik ombor tekshiruvi,
  kunlik tug'ilgan kun tekshiruvi va h.k.).
- **Claude API + Function Calling**: har bir agent uchun alohida system prompt va tool-set
  (asl arxitektura hujjatida 4 agent uchun ham yozilgan, ulardan to'g'ridan-to'g'ri foydalanish
  mumkin).
- **Tashqi integratsiyalar**: Instagram Graph API (webhook + DM), Higgsfield MCP, Eskiz.uz
  (SMS yuborish uchun, O'zbekistonda keng tarqalgan SMS-gateway).
- **`AgentLog` jadvali** — frontend'dagi `agentActivityStore` Zustand store'ining backend
  ekvivalenti, real vaqtda frontendga WebSocket/polling orqali uzatiladi.

## i18n — Foydalanuvchi kiritgan matnlarni avtomatik tarjima qilish

**Muammo**: Xarajatlar, Sotuv, Ombor va boshqa sahifalardagi "Izoh" ustunlari foydalanuvchi
tomonidan to'ldiriladi. Kiritilgan matn qaysi tilda bo'lsa (uz yoki ru), u shu tilda saqlanadi
va boshqa tilda ko'rinsا, o'qilmaydi.

**Hozirgi vaqtinchalik yechim**: Mock ma'lumotlarga `note` (uz) + `noteRu` (ru) juft maydoni
qo'shilgan, komponentda `i18n.language === 'ru' ? exp.noteRu || exp.note : exp.note` orqali
ko'rsatiladi. Bu faqat mock data uchun ishlaydi — yangi kiritilgan izohlar tarjima qilinmaydi.

**Backend bosqichida bajarilishi kerak**:
- Izoh saqlanganda (POST/PUT) backend sifatli tarjima API'ga (Google Cloud Translation yoki
  DeepL) murojaat qilib, ikkinchi til versiyasini ham avtomatik saqlaydi.
- Ma'lumotlar bazasida: `note_uz TEXT`, `note_ru TEXT` — alohida ustunlar.
- Tarjima qilinishi kerak bo'lgan jadvallar: `Expense.note`, `Sale.note`, `StockEntry.note`,
  `Capital.note`, `IncomePayment.note` va boshqa `note` maydonli barcha jadvallar.
- Frontend o'zgarmaydi — faqat API javobida `note_uz`/`note_ru` keladi, komponent tilga qarab
  birini tanlaydi.

**Tavsiya etilgan API**: Google Cloud Translation v2 (Basic) — O'zbek tili uchun sifatli,
DeepL'da o'zbek tili yo'q. Narxi: $20 / 1M belgi (kichik CRM uchun amalda bepul).

---

## Eslatma

Frontend qurilganda komponentlar shunday yozilishi kerakki, yuqoridagi "Backend bosqichida"
ustunidagi o'zgarishlar kiritilganda mavjud UI komponentlarini qayta yozish kerak bo'lmasin —
faqat ma'lumot manbai (mock array → API chaqiruv) almashtirilsin. Shu sababli har bir komponent
ma'lumotni props/hook orqali oladigan qilib yozilishi tavsiya etiladi (masalan
`useSalesAgentData()` custom hook — hozir mock qaytaradi, keyin API chaqiradi).
