# Kararlar ve Varsayımlar

Spesifikasyonda belirsiz kalan veya bilinçli olarak yorumlanan noktalar. Tarih: 2026-10-18.

## Oyun kuralları

1. **Final dalga uzunluğu.** Spesifikasyon hem "dalga ≈ 20 soru" hem de "+8 / +12 / −12, başlangıç 50,
   hedef 100" diyor; bu değerlerle bir dalga ~5–7 doğru cevapta biter. Hissiyatı belirleyen itme değerleri
   korundu; `finalWaveSize` parametresi kaldırıldı. Sonuç: final, birçok kısa canavar karşılaşmasından oluşur
   (her biri ayrı renkte), ilerleme her cevapta kaydedilir. Daha uzun dalga istenirse `battle.hit/fastHit`
   küçültülebilir.
2. **Büyük canavar.** "Son dalga" önceden bilinemediği için, kalan doğru cevap sayısı `bossThreshold` (10)
   veya altına indiğinde başlayan dalga büyük canavardır; itmeler yarıya iner (`bossPushMultiplier`).
3. **Tekrar oynama.** Geçilmiş bir bölümde tüm yeni çarpımlar zaten seviye 2+ olduğundan oturum hemen biterdi.
   Tekrar oyunda ilerleme oturuma özel bir ustalık haritasıyla izlenir (yine her çarpım 2 kez); global ustalık
   ve istatistikler normal güncellenir. Final tekrarında her çarpım bir kez sorulur (300 soru yerine 100).
4. **Yıldızlar** bölümü geçiren oturumun doğruluğu ve **yalnızca doğru cevapların** ortalama süresiyle
   hesaplanır. Yarıda bırakılıp devam edilen bölümde önceki oturumlar yıldıza katılmaz (kayıtta cevap geçmişi
   tutulmadığı için).
5. **Tekrar oranı yuvarlaması.** "n. soruya kadar en az `round(n × oran)` tekrar" kuralı kullanıldı (deterministik
   ve ~%25). Artırılmış oran `maxReviewRatio` (0,6) ile sınırlı; bu yüzden yarıda bırakılıp çok az adımı kalan
   bölümler 20 sorudan kısa sürebilir.
6. **Kova kuralı istisnası.** En düşük kovanın tamamı son 3 soruda sorulmuşsa (tipik: yanlışla 0'a düşen tek
   çarpım) bir üst kovadan seçilir; sıfırlanan çarpımı tekrar kuyruğu 2–4 soru sonra getirir.
7. **"2–4 soru sonra"** = araya 2–4 başka soru girer. Tekrar kuyruğu "son 3" kuralından önceliklidir.
8. **Zorlandıklarım havuzu.** Sorulmuş çarpımlar (en az 8 tane varsa); yoksa tüm çarpımlar — yeni başlayan
   çocuğa hiç görmediği zor çarpımlar yığılmasın diye.
9. **Antrenman sonucu**ndaki "en çok zorlanılan 3 çarpım" o turdaki yanlış sayısına göredir.
10. **Kayan ortalama**: cevap süresi için üstel ortalama, α = 0,3 (son cevaplara ağırlık verir, ama tek
    yavaş cevapla sıçramaz).
11. **Isı haritası sınıfları**: iyi = doğruluk ≥ %85 ve ustalık ≥ 2; orta = doğruluk ≥ %60; aksi zorlanıyor.
12. **Süre bitince** kayıtlı cevap süresi = süre sınırı (ortalamaya girmez, çünkü ortalama sadece doğrular).
13. Uygulama soru sırasında arka plana alınırsa zamanlayıcı durmaz; süre biterse yanlış sayılır. (Basitlik;
    soru ortasında duraklatma bu fazda yok.)

## Bölüm listesi ve kayıt

14. **Bölüm listesi değişince** tamamlanmış bölümler tamamlanmış kalır (önüne yeni bölüm eklense bile); diğer
    bölümler yalnızca bir öncekisi tamamlanmışsa açılır. Kazanılmış ilerleme asla geri alınmaz.
15. **Ayarlar** spesifikasyondaki gibi `MultiplicationSave.settings` içinde; profil listesi ayrı anahtarda
    (`profiles`). Haptik, ses ayarından bağımsız açıktır.
16. **Kalıcılık** için Zustand `persist` middleware yerine özel, 250 ms debounce'lu kaydetme kullanıldı:
    asenkron `StorageAdapter`, migration ve doğrulama hattı tek yerde kalsın diye. Sayfa gizlenince anında yazılır.
17. "İlerlemeyi sıfırla" ayarları ve adı korur, istatistik ve macerayı sıfırlar; 1,5 sn basılı tutma onayı.

## Teknik

18. **Hash router** (react-router yok): statik hosting, PWA ve Capacitor `file://` altında sunucu ayarı gerekmez.
19. **Yazı tipi**: harici font yok (çevrimdışı çalışma ve gizlilik). Sistem yuvarlak font yığını
    (`ui-rounded`, SF Pro Rounded, Nunito …).
20. **`?fast=1`** URL parametresi testler için kısaltılmış config açar (geçme seviyesi 1, final 2, geri sayım 1).
    Üretimde de çalışır; çocuk tarafından bulunması pek olası değil ve zararı yok.
21. **Debug paneli** yalnızca `import.meta.env.DEV` iken render edilir; metinleri bilerek İngilizce ve i18n dışı.
22. **Sesler** tamamen Web Audio ile sentezlenir (dosya yok, lisans sorunu yok). Ayrı "kutlama müziği"
    olarak final sonunda kısa sentez bir melodi çalar.
23. **Framer Motion + SVG**: dönüş merkezi için `originX/originY` kullanılır, `transformBox` verilmez
    (Framer mutlak orijin hesaplar; `fill-box` ile birlikte orijin iki kez kayıyordu).
24. **Sahne kırpma**: bölüm/savaş sahneleri `xMidYMax slice` ile ölçeklenir; dar ekranlarda yanlar kırpıldığı
    için hareketli öğeler yatayda ~%15–85 aralığında tutulur.
25. **Isı haritası hücreleri** 360 px genişlikte ~28 px'tir (56 px hedefinin altında); 11×11 ızgarada başka
    türlü sığmaz. Hücreler yalnızca detay açar, oyun girdisi değildir.
26. Durak isimleri öneriler korunarak kullanıldı; 1. durak "Ev Köyü".
27. **Bağımlılık güvenliği (npm audit).** Vite 6.4.4, Vitest 4.1.12, vite-plugin-pwa 1.3.0, @vitejs/plugin-react
    4.7.0 ve Playwright 1.64.1'e yükseltildi. Kalan 7 uyarı (braces, micromatch, chokidar, fast-glob, postcss-nested,
    postcss-selector-parser, tailwindcss) yalnızca **Tailwind CSS 3** zincirindeydi; **Tailwind CSS 4.3.3**'e
    geçilerek kapatıldı, `npm audit` artık 0 açık gösteriyor. Geçiş resmi `@tailwindcss/upgrade` aracıyla yapıldı:
    `tailwind.config.js`, `postcss.config.js`, `autoprefixer` ve doğrudan `postcss` bağımlılığı kaldırıldı; Tailwind
    `@tailwindcss/vite` eklentisiyle çalışıyor. Tema eklemeleri (`cream`, `ink`, `font-display`) `src/index.css`
    içindeki `@theme` bloğunda; tarama `source('.')` ile yalnızca `src/` klasörüyle sınırlı. Yeniden adlandırılan
    sınıflar güncellendi (`shadow-sm`→`shadow-xs`, `shadow`→`shadow-sm`, `rounded`→`rounded-sm`,
    `bg-gradient-to-*`→`bg-linear-to-*`, `outline-none`→`outline-hidden`, `!pb-0`→`pb-0!` vb.). Görünümü korumak
    için `@layer base` içinde v3 varsayılanları geri getirildi (kenarlık rengi gray-200, placeholder gray-400,
    butonlarda `cursor: pointer`). `.safe-pad`, `.shake`, `.reduce-motion` gibi özel kurallar katmansız kaldı; v3'teki
    gibi yardımcı sınıfları ezer. Bilinçli fark: v4'te `hover:` yalnızca fare olan cihazlarda çalışır, dokunmatik
    ekranda butonlar artık "takılı hover" rengiyle kalmaz. 375×812'de tüm ekranlar öncesi/sonrası ekran
    görüntüsüyle karşılaştırıldı; yerleşim birebir aynı, renkler yalnızca v4'ün oklch paletinden gelen
    gözle görülmeyen farklar taşıyor.
