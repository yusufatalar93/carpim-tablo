# Math Games — Çarpım Tablosu

Çocukların (7–11 yaş) oyun oynayarak matematik öğrenmesi için bir oyun platformu. İlk oyun: **Çarpım Tablosu**.

> Sırtında çantası olan bir çocuk, köyünden yola çıkıp tepedeki **Matematik Okulu**'na ulaşmaya çalışıyor.
> Yol üzerindeki her köy bir bölüm. Okulun kapısında onu son bir sınav bekliyor: kapıyı tutan **canavar**.
> Canavarı yenince okula giriyor; okul bahçesinde piknik yapan, top oynayan arkadaşları onu karşılıyor.

- 🗺️ **Macera** — kolaydan zora 8 durak + final (Okul Kapısı canavar savaşı), harita üzerinde ilerleme
- 🎯 **Antrenman** — zorlanılan çarpımlar ağırlıklı, ya da seçilen tablolar; baskısız
- 📊 **Özet** — 10×10 ısı haritası, tablo başarıları, en zor 5 çarpım ve "Bunları çalış"
- Backend yok, tüm veri cihazda; internet olmadan çalışır (PWA); mobil öncelikli, dokunmatik
- Tüm karakterler/sahneler kodla çizilmiş SVG, tüm sesler Web Audio ile sentezlenir (telifsiz)

## Ekran görüntüleri

| Harita | Bölüm | Final | Sertifika |
|---|---|---|---|
| _(yer tutucu)_ | _(yer tutucu)_ | _(yer tutucu)_ | _(yer tutucu)_ |

## Kurulum ve çalıştırma

Gereksinim: Node.js 20+.

```bash
npm install
```

```bash
npm run dev
```

Tarayıcıda `http://localhost:5173` açılır. Geliştirme modunda sol altta 🐞 **debug paneli** vardır
(bölümleri aç/kilitle, ustalık seviyelerini ayarla, finali doğrudan başlat, okul sahnesine git).

URL'ye `?fast=1` eklemek oyunu kısaltır (bölüm geçmek için her çarpımı 1 kez bilmek yeterli, final 2. seviye).
Uçtan uca testler ve hızlı denemeler içindir: `http://localhost:5173/?fast=1#/`

## Test

```bash
npm test
```

Vitest birim testleri (oyun motoru: bölüm hesapları, kova kuralı, tekrar oranı, ustalık politikaları, yıldızlar,
savaş, antrenman ağırlıkları, kayıt/migration).

```bash
npx playwright install chromium
```

```bash
npm run test:e2e
```

Playwright: Ana ekran → Macera → Harita → Bölüm 1 → Bölüm 2'nin açılması → yenileme sonrası kalıcılık → Özet.

## Build ve PWA

```bash
npm run build
```

```bash
npm run preview
```

`dist/` statik olarak herhangi bir sunucuya (Netlify, GitHub Pages, S3…) konabilir. Hash tabanlı yönlendirme
kullanıldığı için sunucu ayarı gerekmez.

**Ana ekrana ekleme:** Siteyi telefonda açın → iOS Safari: Paylaş → "Ana Ekrana Ekle"; Android Chrome: menü →
"Uygulamayı yükle". İlk açılıştan sonra uygulama internetsiz çalışır.

İkonlar `public/icon.svg`'den üretilir: `npm run icons`.

## Dokümanlar

- [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) — oyun kuralları, bölümler, algoritmalar, parametreler
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — katmanlar, veri akışı, klasör yapısı
- [docs/DATA_MODEL.md](docs/DATA_MODEL.md) — saklanan veri şeması ve sürümleme
- [docs/MOBILE.md](docs/MOBILE.md) — Capacitor ile iOS/Android'e geçiş
- [docs/ADDING_A_GAME.md](docs/ADDING_A_GAME.md) — platforma yeni oyun ekleme
- [docs/DECISIONS.md](docs/DECISIONS.md) — kararlar ve varsayımlar

## Teknoloji

TypeScript (strict) · Vite · React 18 · Tailwind CSS · Framer Motion · canvas-confetti · Zustand ·
Web Audio API · Vitest · Playwright · vite-plugin-pwa
