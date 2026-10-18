# Oyun Tasarımı — Çarpım Tablosu

Bu doküman oyun kurallarının **güncel** halidir. Tüm parametreler
[`src/games/multiplication/config.ts`](../src/games/multiplication/config.ts) içindedir; motor mantığı
[`src/games/multiplication/engine/`](../src/games/multiplication/engine/) altındadır.

## 1. Çarpım havuzu

- Varsayılan aralık `1..10 × 1..10` → 100 çarpım (`minFactor`, `maxFactor`).
- `7×8` ve `8×7` ayrı takip edilir. `treatCommutativeAsSame: true` ile birleştirilir (55 çarpım, id küçük sayı önce).

## 2. Soru akışı (tüm modlar)

1. Büyük **3 – 2 – 1 – Başla!** geri sayımı (`countdownFrom`).
2. Sorular art arda gelir. Doğru cevaptan sonra ~0,45 sn yeşil onay, sonra sıradaki soru.
3. Süre sınırı zorluk ayarından: Kolay 8 sn, Normal 5 sn, Zor 3 sn (`timeLimitsMs`). Halka azalır;
   yarıdan sonra turuncu, son 2 sn (`urgentMs`) kırmızı + tik sesi.
4. Cevap büyük rakam tuş takımıyla (0–9, sil, Tamam) veya klavyeyle (rakamlar, Backspace, Enter).
5. **Süre biterse cevap yanlış sayılır.**
6. **Yanlışta** doğru cevap `7 × 8 = 56` şeklinde ~1,5 sn gösterilir (`wrongRevealMs`).

## 3. Ustalık (mastery)

Her çarpımın global ustalık seviyesi `0..3` vardır.

| Olay | Etki |
|---|---|
| Doğru cevap | +1 (en fazla 3) |
| Yanlış / süre bitti, `wrongAnswerPolicy = "reset"` (varsayılan) | 0'a iner |
| Yanlış / süre bitti, `"decrement"` | 1 düşer |

Ek olarak yanlış bilinen çarpım, **araya 2–4 başka soru girdikten sonra** tekrar sorulur
(`retryAfterMin`/`retryAfterMax`). Bu tekrar, "son 3 soru" kuralından önceliklidir.

### Soru seçimi — kova kuralı (Macera ve final)

Hedefe ulaşmamış çarpımlar arasında **en düşük seviye** bulunur ve soru yalnızca o seviyedeki
çarpımlardan rastgele seçilir. Böylece hiçbir çarpım, diğerleri aynı seviyeye gelmeden ikinci kez sorulmaz.
Son sorulan 3 çarpım (`recentExclusion`) tekrar seçilmez. En düşük kovanın tamamı yakın zamanda sorulmuşsa
(ör. yanlışla 0'a düşen tek çarpım) bir sonraki kovaya geçilir; sıfırlanan çarpımı tekrar kuyruğu geri getirir.

### Zayıflık ağırlığı (Antrenman ve Macera tekrarları)

```
ağırlık = 1 + 3 × hataOranı + (ortalamaSüre > 3 sn ? 1 : 0) + (ustalık < 3 ? 1 : 0)
```

Hiç sorulmamış çarpımlar orta ağırlık alır (`weight.unseenWeight = 2.5`). Tüm katsayılar `config.weight` içinde.

## 4. Macera

### Bölümler

| # | Durak | Yeni tablolar | Yeni çarpım |
|---|---|---|---|
| 1 | Ev Köyü | 1'ler, 10'lar | 36 |
| 2 | Değirmen Köyü | 2'ler | 15 |
| 3 | Köprü Başı | 5'ler | 13 |
| 4 | Elma Bahçesi | 3'ler | 11 |
| 5 | Orman Kenarı | 4'ler | 9 |
| 6 | Şelale Köyü | 9'lar | 7 |
| 7 | Zorlu Geçit | 6'lar, 7'ler, 8'ler | 9 |
| 8 | Okul Kapısı — FİNAL | Tümü | 100 |

- **Yeni çarpımlar** bölüm listesinden otomatik hesaplanır: bölümün tablolarından birini içeren ve önceki
  bölümlerde olmayan tüm çarpımlar (her iki sırada). Elle liste yazılmaz.
- **Tekrar çarpımları:** önceki bölümlerin çarpımlarından zayıflık ağırlığına göre seçilir. Soruların ~%25'i
  (`reviewRatio`) tekrardır. Yeni çarpımı az olan bölümlerde oran, bölüm en az `minQuestionsPerLevel` (20)
  soru sürecek şekilde artırılır: `oran = 1 − kalanAdım / 20`, üst sınır `maxReviewRatio` (0,6).
- **Geçme:** bölümün tüm yeni çarpımları `levelPassMastery` (2) seviyesine ulaşınca. Tekrar çarpımlarındaki
  hata geçmeyi engellemez ama o çarpımın ustalığını düşürür. Bölümden çıkılırsa ustalıklar korunur; tekrar
  girince kalan yerden devam edilir.
- **Kilit:** bir bölüm, ondan önceki bölüm tamamlanmadan açılmaz.

### Yıldızlar

Bölümü geçiren oturumun doğruluğu ve **doğru cevapların** ortalama süresiyle:

| Yıldız | Koşul (`config.stars`) |
|---|---|
| ⭐⭐⭐ | doğruluk ≥ %90 ve ortalama < 3 sn |
| ⭐⭐ | doğruluk ≥ %75 |
| ⭐ | bölüm geçildi |

Geçilmiş bölümler **tekrar oynanabilir**: tekrar oyunda ilerleme oturuma özel sayılır (her yeni çarpım bu
oturumda yine 2 kez doğru bilinmeli), global ustalık/istatistikler normal güncellenir, en iyi yıldız saklanır.

### Harita

Dikey kaydırılan harita: altta ev, kıvrımlı patika, tepede Matematik Okulu (bayrak, bahçe, piknik yapan ve
top oynayan çocuklar — en baştan görünür). Durak durumları: **kilitli** (gri + kilit ikonu), **açık**
(turuncu, nabız atar), **geçilmiş** (yeşil + yıldızlar). Bölüm geçilince haritaya dönüşte kilit uçar,
parıltı patlar, çocuk patika boyunca yürüyerek sonraki durağa gider. Harita açılınca çocuğun durağına kaydırılır.

### Normal bölüm sahnesi

Yatay yolda çantalı çocuk; sağda durağın varış noktası. Çocuğun konumu kalan ustalık adımlarını izler
(ustalık sıfırlanırsa hafifçe geri kayar). Doğru: zıplama + parıltı + "dın" (kombo arttıkça perde yükselir);
3+ komboda koşma, "x3 KOMBO!" rozeti ve konfeti. Yanlış: önüne taş/su birikintisi çıkar, çocuk tökezler,
ekran sallanır, "bonk". Bölüm sonu: çocuk köye girer, kuşlar, konfeti, yıldızlar tek tek gelir.

## 5. Final — Okul Kapısı Savaşı

- Hedef: **tüm çarpımlar seviye 3** (`finalMastery`). Kova kuralı ve tekrar kuyruğu aynen geçerli.
- Final, **dalgalara** bölünür; her dalga bir canavar karşılaşmasıdır. Dalgalar arasında ilerleme kaydedilir.
- Mesafe `0..100`, başlangıç 50:
  - Doğru: +8; sürenin ilk yarısında cevaplanırsa +12. Kombo sayacı.
  - Yanlış / süre bitti: −12, canavar ileri atılır, ekran sallanır.
  - 100 → canavar kaçar, dalga kazanıldı. 0 → "Az kaldı! Tekrar dene"; **ustalık kaybolmaz**, dalga yeniden başlar.
- **Büyük canavar:** kalan doğru cevap sayısı `bossThreshold` (10) veya altına inince gelir; itmeler
  `bossPushMultiplier` (0,5) ile yarıya iner.
- Bitiş: canavar kaçar, kapı açılır, havai fişek ve kutlama müziği → okul bahçesi sahnesi → **"Çarpım Tablosu
  Ustası"** sertifikası (ad, tarih, toplam yıldız) ve "Yakında: yeni dersler" ipucu.

> Not: Spesifikasyondaki "dalga ≈ 20 soru" ile "+8/+12/−12" değerleri çelişir; itme değerleri korunmuştur,
> bu yüzden bir dalga ~5–7 soru sürer. Ayrıntı: [DECISIONS.md](DECISIONS.md).

## 6. Antrenman

- **Zorlandıklarım** (varsayılan): sorulmuş çarpımlar arasında ağırlıklı rastgele seçim (8'den az çarpım
  sorulmuşsa tüm havuz).
- **Tablo seç:** bir veya birden çok tablo.
- **Seçilen çarpımlar:** Özet ekranındaki "Bunları çalış" ile gelen liste.
- Süre sınırı varsayılan kapalı, açılabilir. Tur: 10 / 20 / 30 soru.
- Sonuç: doğru/yanlış sayısı ve bu turda en çok yanlış yapılan 3 çarpım.
- Antrenman **istatistikleri günceller**, Macera'daki ustalık ve bölüm ilerlemesini **değiştirmez**.

## 7. Özet

- 10×10 ısı haritası: gri = sorulmadı (·), kırmızı = zorlanıyor (!), sarı = orta (~), yeşil = iyi (✓).
  İyi: doğruluk ≥ %85 ve ustalık ≥ 2; orta: doğruluk ≥ %60. Hücreye dokununca: kaç kez soruldu,
  doğru/yanlış, ortalama süre, ustalık, ait olduğu bölüm.
- Tablo bazında başarı çubukları, en zor 5 çarpım + "Bunları çalış", Macera durumu, genel sayılar.

## 8. Ayarlanabilir parametreler

| Parametre | Varsayılan | Açıklama |
|---|---|---|
| `minFactor` / `maxFactor` | 1 / 10 | Çarpım aralığı |
| `treatCommutativeAsSame` | false | 7×8 ve 8×7 tek çarpım mı |
| `levelPassMastery` | 2 | Normal bölüm geçme seviyesi (1 = her birini bir kez bilmek) |
| `finalMastery` | 3 | Final hedef seviyesi |
| `wrongAnswerPolicy` | `"reset"` | `"reset"` veya `"decrement"` |
| `reviewRatio` | 0.25 | Tekrar sorusu oranı |
| `maxReviewRatio` | 0.6 | Artırılmış oranın üst sınırı |
| `minQuestionsPerLevel` | 20 | Bölüm başına asgari soru |
| `recentExclusion` | 3 | Tekrar seçilmeyen son soru sayısı |
| `retryAfterMin` / `Max` | 2 / 4 | Yanlış çarpımın tekrar sorulma aralığı |
| `timeLimitsMs` | 8000 / 5000 / 3000 | Kolay / Normal / Zor |
| `urgentMs` | 2000 | Kırmızı halka + tik |
| `wrongRevealMs` | 1500 | Doğru cevabın gösterilme süresi |
| `countdownFrom` | 3 | Başlangıç geri sayımı |
| `stars.*` | 0.9 / 3000 / 0.75 | Yıldız eşikleri |
| `weight.*` | 1 / 3 / 3000 / 1 / 1 / 2.5 | Zayıflık ağırlığı katsayıları |
| `battle.start/max` | 50 / 100 | Mesafe |
| `battle.hit/fastHit/miss` | 8 / 12 / 12 | İtme değerleri |
| `battle.bossPushMultiplier` | 0.5 | Büyük canavara karşı itme çarpanı |
| `battle.bossThreshold` | 10 | Büyük canavarın geldiği kalan adım sayısı |
| `practice.roundLengths` | 10, 20, 30 | Antrenman tur seçenekleri |
| `practice.timerDefaultOn` | false | Antrenmanda süre varsayılanı |

`?fast=1` URL parametresi `fastConfig`'i kullanır (testler için kısaltılmış).

## 9. Bölüm ekleme / sıralama değiştirme

[`src/games/multiplication/levels.ts`](../src/games/multiplication/levels.ts) dosyasındaki diziyi düzenleyin:

```ts
{ id: 'meadow', nameKey: 'meadow', tables: [11], scene: 'forest' },
```

1. `id` kalıcıdır (kayıtta saklanır) — mevcut id'leri değiştirmeyin.
2. `nameKey` için `src/i18n/tr.json` → `levels.meadow` metnini ekleyin.
3. `scene` haritadaki/sahnedeki çizimi seçer (`home`, `mill`, `bridge`, `orchard`, `forest`, `waterfall`, `pass`, `school`).
4. Yeni çarpımlar otomatik hesaplanır; sırayı değiştirmek yeterlidir. Final her zaman `isFinal: true` olan son giriştir.
5. Eski kayıtlar bozulmaz: bilinmeyen id'ler yok sayılır, yeni bölümler kilit durumuna göre eklenir
   (bkz. [DATA_MODEL.md](DATA_MODEL.md)). 8'den fazla durakta harita konumları otomatik dağıtılır.
