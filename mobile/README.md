# SICRM mobil ilovasi (Android + iOS)

Capacitor qobig'i: ilova ichida https://gt.sicrm.uz ochiladi. Frontend deploy qilinsa, telefondagi ilova ham
yangilanadi — do'konga qayta chiqarish faqat native qism (`android/`, `ios/`, `capacitor.config.json`, ikonka) o'zgarsa kerak.
Offlayn: birinchi ochilishdan keyin service worker ilovani internetsiz ham ochadi; umuman internet bo'lmasa `www/offline.html`.

- App ID: `uz.sicrm.app`, nomi `SICRM`
- Ikonka/splash manbalari: `mobile/assets/` → `npx @capacitor/assets generate --assetPath mobile/assets ...`
- Ruxsatlar: kamera (FaceID selfie, barkod), galereya (rasm tanlash)

## Yig'ish (bulutda — GitHub Actions, "Mobil ilova" workflow)
Lokal kompyuterda Android Studio/Xcode shart emas. GitHub → Actions → "Mobil ilova" → Run workflow.
- **Android**: har doim debug APK (telefonga to'g'ridan-to'g'ri o'rnatish uchun). Imzo kaliti secrets'da bo'lsa — Google Play uchun `.aab` va imzolangan APK.
- **iOS**: simulyator uchun yig'ish tekshiruvi. App Store/TestFlight uchun Apple Developer hisobi kerak (pastda).

## Do'konlarga chiqarish uchun kerak
**Google Play** — Google Play Console hisobi (bir martalik $25). GitHub secrets:
`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
Kalit fayli YO'QOTILMASIN (nusxasi `key/` papkada saqlanadi).

**App Store** — Apple Developer Program ($99/yil). Keyin: App Store Connect API kaliti + imzo sertifikati →
workflow'ga TestFlight'ga yuklash qadami qo'shiladi.

## Ma'lum cheklovlar (keyingi bosqich)
- `window.print()` (barkod/chek chop etish) va fayl yuklab olish (Excel) WebView ichida ishlamasligi mumkin —
  native plaginlar bilan almashtiriladi.
