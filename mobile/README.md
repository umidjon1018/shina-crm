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

## Tarqatish (do'konlarsiz — mijozga o'zimiz beramiz)
Kompaniya kodi ilova ochilganda so'raladi (`ceramix`, `goodtires`; taxalluslar serverda — `ops/tenant.sh alias`).
Secrets: https://github.com/umidjon1018/shina-crm/settings/secrets/actions · yig'ish: Actions → "Mobil ilova".

**Android**: imzolangan APK GitHub Release'ga qo'yiladi, doimiy havola:
https://github.com/umidjon1018/shina-crm/releases/latest/download/sicrm.apk
Kalit: `key/android_release.p12` (PKCS12, alias `sicrm`, parol `key/android_keystore_password.txt`). YO'QOTMA —
boshqa kalit bilan imzolangan versiya eskisining ustiga o'rnatilmaydi. GitHub secrets:
`ANDROID_KEYSTORE_BASE64` (= `key/android_keystore_base64.txt`), `ANDROID_KEYSTORE_PASSWORD`.
Repo yopiq (private) qilinsa — Release havolasi ishlamaydi, APK'ni serverga qo'yish kerak bo'ladi.

**iOS**: App Store'siz o'rnatish faqat Apple Developer hisobi ($99/yil) bilan — Ad Hoc (har yili 100 tagacha
qurilma, UDID ro'yxatga olinadi). Hisobsiz — PWA (Safari → Ulashish → "Bosh ekranga qo'shish").

## Ma'lum cheklovlar (keyingi bosqich)
- `window.print()` (barkod/chek chop etish) va fayl yuklab olish (Excel) WebView ichida ishlamasligi mumkin —
  native plaginlar bilan almashtiriladi.
