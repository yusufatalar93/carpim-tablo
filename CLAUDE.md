# Math Games — Çarpım Tablosu Oyunu (Faz 1)

> Bu dosya Claude Code için proje talimatıdır. Projeyi baştan sona bu dokümana göre kur, geliştir, test et ve belgele.
> Belirsiz kalan bir nokta olursa makul bir varsayım yap, varsayımı `docs/DECISIONS.md` dosyasına yaz ve devam et.

---

## 1. Vizyon

**Math Games**, çocukların oyun oynayarak matematik öğrenmesini sağlayan bir oyun platformudur. İleride birçok oyun içerecek. Bu fazda **yalnızca ilk oyun** yapılacak:

**Çarpım Tablosu Oyunu** — çocuğa çarpım tablosunu ezberleten, animasyonlu ve sesli, hızlı tempolu bir oyun.

Hedef kitle: ilkokul çağındaki çocuklar (yaklaşık 7–11 yaş). Arayüz dili: **Türkçe**.

### Hikâye

Sırtında çantası olan bir çocuk, köyünden yola çıkıp tepedeki **Matematik Okulu**'na ulaşmaya çalışıyor. Yol üzerinde köyler ve duraklar var; her durak bir **bölüm**. Çocuk her bölümü geçtikçe haritada bir sonraki köye ilerliyor. Okulun kapısında onu son bir sınav bekliyor: kapıyı tutan **canavar** (final bölüm). Canavarı yenince okula giriyor; okul bahçesinde piknik yapan, oyun oynayan diğer çocuklar onu karşılıyor.

---

## 2. Temel Kısıtlar

- **Backend yok.** Her şey istemci tarafında çalışır. Veriler cihazda (lokal) saklanır.
- **Şimdilik web uygulaması**, ama:
  - Tamamen **mobil uyumlu** (önce mobil tasarım, dokunmatik öncelikli, dikey ekran öncelikli).
  - İleride **iOS ve Android'e minimum eforla** geçilebilecek mimaride olmalı.
- Telif hakkı olan karakter, görsel, ses veya müzik **kullanılmaz**. Tüm karakterler, harita ve sahneler orijinal olmalı (kodla çizilmiş SVG), sesler kodla üretilmeli (Web Audio API) veya açıkça serbest lisanslı (CC0) olmalı.
- Kurulum sonrası **internet bağlantısı olmadan** çalışabilmeli (PWA).

---

## 3. Teknoloji Yığını

| Alan | Seçim | Neden |
|---|---|---|
| Dil | TypeScript (strict) | Güvenli refactor, oyun motoru mantığı için tip güvenliği |
| Build | Vite | Hızlı, basit |
| UI | React 18 | Capacitor ile mobile geçiş kolay, ekosistem geniş |
| Stil | Tailwind CSS | Hızlı responsive geliştirme |
| Animasyon | Framer Motion + canvas-confetti (veya eşdeğer hafif partikül efekti) | Karakter, harita ve canavar animasyonları, patlama efektleri |
| Ses | Web Audio API ile sentezlenmiş efektler (ör. ZzFX tarzı küçük bir yardımcı) | Lisans sorunu yok, dosya boyutu sıfıra yakın |
| State | Zustand | Basit, persist middleware desteği |
| Kalıcılık | `StorageAdapter` arayüzü arkasında `localStorage` | Mobile geçince Capacitor Preferences ile değiştirilebilir |
| Test | Vitest (birim), Playwright (temel uçtan uca akış) | |
| PWA | vite-plugin-pwa | Offline çalışma, ana ekrana ekleme |
| Mobil (sonraki adım) | Capacitor | Aynı web kodunu iOS/Android'e paketler |

**Mimari kural:** Oyun mantığı (bölüm tanımları, soru seçimi, ustalık hesabı, bölüm geçme, yıldız, skor, istatistik) **saf TypeScript** olarak `src/games/multiplication/engine/` altında yazılmalı; React'e, DOM'a veya `localStorage`'a bağımlı olmamalı. Böylece motor tamamen test edilebilir ve gerekirse React Native'e bile taşınabilir.

---

## 4. Klasör Yapısı (öneri)

```
math-games/
├── CLAUDE.md
├── README.md
├── docs/
│   ├── GAME_DESIGN.md        # Oyun kuralları, bölümler, algoritmalar, parametreler
│   ├── ARCHITECTURE.md       # Katmanlar, veri akışı, klasör yapısı
│   ├── DATA_MODEL.md         # Saklanan veri şeması ve sürümleme
│   ├── MOBILE.md             # Capacitor ile iOS/Android'e geçiş rehberi
│   ├── ADDING_A_GAME.md      # Platforma yeni oyun ekleme rehberi
│   └── DECISIONS.md          # Alınan kararlar ve varsayımlar
├── src/
│   ├── app/                  # Router, ana ekran (oyun seçimi), ayarlar
│   ├── platform/             # StorageAdapter, ses motoru, haptik, ortak servisler
│   ├── ui/                   # Ortak bileşenler (Button, Keypad, Modal...)
│   ├── i18n/                 # tr.json (tüm metinler burada)
│   └── games/
│       └── multiplication/
│           ├── engine/       # Saf TS: facts, levels, scheduler, mastery, stars, stats, battle
│           ├── components/   # Kid, Monster, WorldMap, LevelScene, BattleScene, TimerRing, Heatmap...
│           ├── screens/      # Menü, Harita, Bölüm, Final, Okul (bitiş), Antrenman, Özet
│           ├── levels.ts     # Bölüm listesi (veri olarak)
│           ├── sounds.ts
│           └── config.ts     # Tüm ayarlanabilir parametreler
└── tests/
```

Metinler bileşenlerin içine gömülmemeli; hepsi `src/i18n/tr.json` içinden gelmeli (ileride Almanca/İngilizce eklenebilsin).

---

## 5. Uygulama Akışı

1. **Ana ekran (Math Games hub):** Oyun kartları. Şimdilik yalnızca "Çarpım Tablosu" aktif; birkaç kart "Yakında" olarak gri gösterilebilir.
2. **İlk açılış:** Çocuğun adını sor (opsiyonel, atlanabilir). Tek profil yeterli; veri modeli ileride çoklu profile izin verecek şekilde tasarlanmalı.
3. **Çarpım Tablosu menüsü:** Üç büyük buton:
   - 🗺️ **Macera** → Harita ekranı açılır
   - 🎯 **Antrenman**
   - 📊 **Özet**
   - Ayrıca ilerleme göstergesi: "Bölüm 4 / 8" gibi.
4. **Ayarlar:** Ses aç/kapat, hareketleri azalt (reduce motion), zorluk (süre), ilerlemeyi sıfırla (onaylı; basit bir "basılı tut" onayı yeterli).

---

## 6. Oyun Tasarımı

### 6.1 Çarpım havuzu (facts)

- Varsayılan aralık: `1..10 × 1..10` → **100 çarpım**. Aralık `config.ts` içinden değiştirilebilir olmalı.
- `7×8` ve `8×7` **ayrı** çarpımlar olarak takip edilir (çocuk ikisini de bilmeli). `config.treatCommutativeAsSame` ile değiştirilebilir olsun (varsayılan `false`).

### 6.2 Soru akışı ve süre (tüm modlarda ortak)

- Bölüm/tur başında büyük bir **3 – 2 – 1** geri sayımı.
- Sorular **art arda**, beklemeden gelir.
- Her soru için süre sınırı (varsayılan **5 saniye**). Süre, sorunun etrafında azalan bir halka/çubuk ile gösterilir; son 2 saniyede renk değişir ve hafif tik sesi çalar.
- Zorluk ayarı: Kolay 8 sn, Normal 5 sn, Zor 3 sn.
- **Cevap girişi:** Ekranda büyük rakam tuş takımı (0–9, sil, Tamam). Masaüstünde klavye ve Enter da çalışmalı. Çoktan seçmeli değil, çünkü amaç ezber.
- **Süre biterse** cevap yanlış sayılır.
- **Yanlış cevapta** doğru cevap ekranda ~1,5 sn net şekilde gösterilir (ör. `7 × 8 = 56`), sonra sıradaki soruya geçilir. Bu öğrenme için kritik.

### 6.3 Ustalık (mastery) sistemi

Her çarpımın **global** bir ustalık seviyesi vardır: `0, 1, 2, 3`.

- Normal bölümlerde hedef: çarpımların **seviye 2**'ye ulaşması (`config.levelPassMastery = 2`; 1 yapılırsa "her birini bir kez bilmek" yeterli olur).
- Final bölümde hedef: **tüm çarpımların seviye 3**'e ulaşması (`config.finalMastery = 3`).
- Böylece normal bölümleri bitiren çocuk, finalde her çarpımı bir kez daha doğru bilerek tabloyu tamamlamış olur.

**Soru seçme kuralı (seviye kovaları)** — bir bölümün hedef çarpımları için:
- Hedefe ulaşmamış çarpımlar arasındaki **en düşük seviye** bulunur.
- Sıradaki soru yalnızca bu en düşük seviyedeki çarpımlardan **rastgele** seçilir.
- Böylece hiçbir çarpım ikinci kez sorulmadan önce diğerleri birer kez sorulmuş olur.
- Son sorulan 3 çarpım tekrar seçilmez (havuz yeterince büyükse).

**Doğru cevapta:** seviye +1 (en fazla 3).

**Yanlış cevapta / süre bitince:**
- Varsayılan: seviye **0'a sıfırlanır** (`config.wrongAnswerPolicy = "reset"`).
- Alternatif: seviye 1 düşer (`"decrement"`).
- Ek olarak, yanlış bilinen çarpım **2–4 soru sonra tekrar sorulur** (kısa vadeli pekiştirme).

### 6.4 Macera: Harita ve Bölümler

Macera modu, **kolaydan zora sıralı bölümlerden** oluşur. Her bölüm haritada bir köy/duraktır. Bir bölüm geçilmeden sonraki açılmaz.

**Bölüm listesi** (`levels.ts` içinde veri olarak tanımlanır, kolayca değiştirilebilir):

| # | Durak (harita) | Yeni öğretilen tablolar | Yaklaşık yeni çarpım sayısı |
|---|---|---|---|
| 1 | Ev (başlangıç köyü) | 1'ler ve 10'lar | 36 |
| 2 | Değirmen Köyü | 2'ler | 15 |
| 3 | Köprü Başı | 5'ler | 13 |
| 4 | Elma Bahçesi | 3'ler | 11 |
| 5 | Orman Kenarı | 4'ler | 9 |
| 6 | Şelale Köyü | 9'lar | 7 |
| 7 | Zorlu Geçit | 6'lar, 7'ler, 8'ler | 9 |
| 8 | **Okul Kapısı — FİNAL** | Tümü (100 çarpım) | — |

Durak isimleri öneridir; daha iyi isimler bulabilirsin.

**Bir bölümün çarpımları:**
- **Yeni çarpımlar:** Bölümün tablolarından birini içeren ve **daha önceki bölümlerde olmayan** tüm çarpımlar (her iki sırada: `3×7` ve `7×3`). Motor bunu bölüm listesinden otomatik hesaplar; elle liste yazılmaz.
- **Tekrar çarpımları:** Önceki bölümlerden, zayıflık ağırlığına göre (bkz. 6.8 formülü) seçilen çarpımlar. Soruların yaklaşık **%25'i** tekrar olur (`config.reviewRatio`).
- Yeni çarpım sayısı az olan bölümlerde, bölümün en az `config.minQuestionsPerLevel` (varsayılan 20) soru sürmesi için tekrar oranı artırılır.

**Bölüm geçme koşulu:** Bölümün **tüm yeni çarpımları** `levelPassMastery` seviyesine (varsayılan 2) ulaşınca bölüm geçilir.
- Tekrar çarpımlarında yapılan hata bölümü engellemez, ama o çarpımın ustalığını `wrongAnswerPolicy`'e göre düşürür (final bunu yakalar).
- Bölüm ortasında çıkılırsa ilerleme (ustalık seviyeleri) korunur; tekrar girince kaldığı yerden devam eder.

**Yıldızlar (1–3):** Bölüm sonunda doğruluk oranı ve ortalama cevap süresine göre verilir:
- ⭐⭐⭐ doğruluk ≥ %90 ve ortalama süre < 3 sn
- ⭐⭐ doğruluk ≥ %75
- ⭐ bölüm geçildi
- Eşikler `config.ts` içinde. Geçilmiş bölümler daha çok yıldız için **tekrar oynanabilir** (tekrar oynamada istatistikler güncellenir, en iyi yıldız saklanır).

### 6.5 Harita ekranı

- **Dikey kaydırılan** bir harita (telefonda dikey ekrana uygun): altta çocuğun evi/köyü, kıvrımlı bir patika yukarı doğru çıkar, en tepede **tepedeki Matematik Okulu**.
- Patika üzerinde her bölüm bir durak (köy, değirmen, köprü, orman, şelale, geçit...). Durak durumları:
  - **Kilitli:** gri, üzerinde kilit ikonu
  - **Açık:** parlak, hafifçe zıplayan/nabız atan
  - **Geçilmiş:** kazanılan yıldızlar görünür
- **Sırtında çantası olan çocuk** karakteri haritada bulunduğu durakta durur.
- Bölüm geçilince haritaya dönüldüğünde: sonraki durağın kilidi açılma animasyonu, ardından çocuğun **patika boyunca yürüyerek** bir sonraki durağa ilerlemesi animasyonu.
- Harita açıldığında otomatik olarak çocuğun bulunduğu durağa kaydırılır.
- Okul tepede, uzaktan görünür olmalı (hedef baştan belli olsun); bayrak, bahçe, ağaçlar, piknik yapan çocuk siluetleri.
- Harita ve tüm duraklar orijinal SVG çizimler olmalı.

### 6.6 Normal bölüm sahnesi

- Yatay bir yol sahnesi: çocuk (çantasıyla) yolda, sağda bölümün varış noktası (köy tabelası/kapısı) görünür.
- Ekranın üstünde bölüm ilerleme çubuğu: hedefe ulaşan yeni çarpım oranı (ör. "9 / 15").
- **Doğru cevap:** Çocuk ileri doğru adım atar/zıplar, etrafında parıltı, küçük partikül patlaması, "dın!" sesi. Combo'da çocuk koşar, efekt büyür ("x3 KOMBO!").
- **Yanlış cevap / süre bitti:** Çocuk tökezler veya önüne bir engel çıkar (taş, su birikintisi), ekran hafifçe sallanır, "bonk" sesi, doğru cevap gösterilir. Çocuğun konumu ilerleme çubuğunu takip eder (ustalık sıfırlanırsa çocuk biraz geri kayabilir; bu cezalandırıcı değil, hafif ve komik olmalı).
- **Bölüm geçildi:** Çocuk köye varır, köy sakinleri/kuşlar/havai fişek kutlaması, yıldızlar tek tek gelir, "Haritaya dön" ve "Tekrar oyna" butonları.

### 6.7 Final bölüm: Okul Kapısı Savaşı

Son durak. Okulun kapısını bir **canavar** tutuyor. Canavarı yenmek için tüm çarpım tablosunun bilinmesi gerekiyor.

- **Hedef:** Tüm 100 çarpımın ustalık seviyesi 3'e ulaşmalı. Normal bölümleri geçmiş bir çocuk için bu, kabaca her çarpımı bir kez daha doğru bilmek demektir. Yanlış bilinen çarpımın seviyesi politikaya göre düşer ve daha çok tekrar gerekir.
- Kova kuralı ve yanlış tekrar kuyruğu aynen uygulanır.
- Uzun olmaması için final **dalgalara** bölünür: her dalga bir canavar karşılaşmasıdır (yaklaşık 20 soru, `config.finalWaveSize`). Dalgalar arasında ilerleme kaydedilir; çocuk çıkıp sonra devam edebilir. Son dalgada "büyük canavar" gelir.

**Savaş mekaniği (her dalga için):**
- Çocuk ile canavar arasında bir **mesafe** değeri var (0–100). Başlangıç: **50**.
- **Doğru cevap:** Çocuk canavara vurur (kısa vurma animasyonu), canavar geri savrulur → mesafe artar. Temel itme +8; sürenin ilk yarısında cevaplanırsa +12. Combo sayacı ve büyüyen efekt.
- **Yanlış cevap / süre bitti:** Canavar ileri atılır → mesafe −12, ekran sallanır, çocuk irkilir.
- **Mesafe 100:** Canavar geri kaçar → dalga kazanıldı → sıradaki dalga.
- **Mesafe 0:** Dalga kaybedildi → cesaretlendirici ekran ("Az kaldı! Tekrar dene"). **Ustalık ilerlemesi kaybolmaz**, sadece o dalga yeniden başlar.
- Üstte finalin genel ilerlemesi: "Tamamlanan: 87 / 100".

**Bitiş (tüm çarpımlar seviye 3):**
- Canavar büyük bir animasyonla kaçar, okul kapısı açılır.
- Çocuk okul bahçesine girer: piknik yapan, top oynayan, el sallayan çocuklar; havai fişekler, kutlama müziği.
- Ardından **"Çarpım Tablosu Ustası"** sertifika ekranı (çocuğun adı, tarih, toplam yıldız). Ekran görüntüsü alınabilir güzellikte olmalı.
- Okul, ileride Math Games'in sonraki oyunlarına (daha ileri seviye) kapı olarak kullanılabilir; bitiş ekranında "Yakında: yeni dersler" gibi bir ipucu olabilir.

### 6.8 Ses ve animasyon geri bildirimi (genel kurallar)

**Doğru cevapta:** Parlak "dın!" sesi (combo arttıkça perde hafifçe yükselir), parıltı/partikül, sayının yeşil parlaması.

**Yanlış cevapta:** Kısa, cezalandırıcı olmayan "bonk" sesi, ekran sarsıntısı, doğru cevabın belirgin gösterimi.

**Diğer:**
- Bölüm geçme, kilit açılma, haritada yürüme, final dalgası kazanma ve oyunu bitirme için ayrı sesler ve animasyonlar.
- Mobilde destekleniyorsa hafif titreşim (haptik), `platform/` altındaki bir servis üzerinden (web'de `navigator.vibrate`, ileride Capacitor Haptics).
- `prefers-reduced-motion` ve ayarlardaki "hareketleri azalt" seçeneğine uyulmalı.
- Animasyonlar 60 fps hedeflemeli; orta seviye bir telefonda takılmamalı.

### 6.9 Antrenman modu

Amaç: çocuğun **zorlandığı** çarpımları çalıştırmak. Harita ve canavar yok; baskı daha düşük.

- Seçenekler:
  - **"Zorlandıklarım"** (varsayılan): İstatistiklere göre ağırlıklı rastgele seçim.
  - **Tablo seçimi:** Bir veya birden fazla tablo seçilir (ör. sadece 7'ler ve 8'ler).
- Ağırlık formülü (başlangıç önerisi, `config.ts` içinde; Macera'daki tekrar seçimi de bunu kullanır):
  `ağırlık = 1 + 3 × hataOranı + (ortalamaSüre > 3sn ? 1 : 0) + (ustalık < 3 ? 1 : 0)`
  Hiç sorulmamış çarpımlar orta ağırlık alır.
- Süre sınırı varsayılan olarak **kapalı** (açılabilir).
- Tur uzunluğu: 20 soru (seçilebilir: 10 / 20 / 30).
- Tur sonunda kısa sonuç ekranı: doğru/yanlış sayısı, en çok zorlanılan 3 çarpım.
- Antrenman **istatistikleri günceller** ama Macera'daki **ustalık seviyelerini ve bölüm ilerlemesini değiştirmez**.

### 6.10 Özet (Summary) ekranı

- **10×10 ısı haritası:** Her hücre bir çarpım. Renk, o çarpımın durumuna göre (hiç sorulmadı = gri, zorlanıyor = kırmızı, orta = sarı, iyi = yeşil). Hücreye dokununca detay: kaç kez soruldu, doğru/yanlış, ortalama cevap süresi, ustalık seviyesi, hangi bölüme ait olduğu.
- **Tablo bazında çubuklar:** 1'ler … 10'lar tablosu için başarı yüzdesi.
- **En zor 5 çarpım** listesi ve "Bunları çalış" butonu → Antrenman'ı bu çarpımlarla başlatır.
- **Macera durumu:** Geçilen bölüm sayısı, toplam yıldız.
- Genel sayılar: toplam soru, genel doğruluk, ortalama cevap süresi.

---

## 7. Veri Modeli (lokal)

Tam geçmiş (her cevabın kaydı) **tutulmaz**. Sadece çarpım başına özet istatistik ve bölüm ilerlemesi tutulur. Veri küçük kalmalı.

```ts
interface FactStats {
  id: string;              // "7x8"
  a: number;
  b: number;
  mastery: 0 | 1 | 2 | 3; // global ustalık
  attempts: number;
  correct: number;
  wrong: number;           // süre bitmesi dahil
  avgResponseMs: number;   // sadece doğru cevaplar için, kayan ortalama
  lastSeenAt?: number;     // timestamp
}

interface LevelProgress {
  levelId: string;
  status: "locked" | "unlocked" | "completed";
  bestStars: 0 | 1 | 2 | 3;
  bestAccuracy?: number;
  completedAt?: number;
}

interface PlayerProfile {
  id: string;
  name?: string;
  createdAt: number;
}

interface MultiplicationSave {
  schemaVersion: 1;
  profileId: string;
  facts: Record<string, FactStats>;
  adventure: {
    levels: Record<string, LevelProgress>;
    currentLevelId: string;   // haritada çocuğun durduğu durak
    final: {
      wavesWon: number;
      completedAt?: number;
    };
  };
  settings: {
    soundOn: boolean;
    reduceMotion: boolean;
    difficulty: "easy" | "normal" | "hard";
  };
}
```

- Tüm okuma/yazma `StorageAdapter` arayüzü üzerinden yapılır:
  ```ts
  interface StorageAdapter {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    remove(key: string): Promise<void>;
  }
  ```
  (Asenkron arayüz, çünkü Capacitor Preferences asenkron çalışır.)
- `schemaVersion` ile basit bir **migration** mekanizması kur.
- Bozuk/okunamayan veri durumunda uygulama çökmemeli, varsayılan duruma dönmeli.
- Bölüm listesi değişirse (ör. yeni bölüm eklenirse) kayıtlı ilerleme bozulmamalı; bilinmeyen `levelId`'ler yok sayılmalı, yeni bölümler uygun durumda (kilitli/açık) eklenmeli.

---

## 8. Tasarım ve Erişilebilirlik

- Çocuk dostu, canlı ama göz yormayan renk paleti; büyük, kalın, okunaklı rakamlar.
- Görsel dünya tutarlı olmalı: harita, bölüm sahneleri ve okul aynı çizim stilinde (sıcak renkli köyler, yeşil tepeler, patika).
- Dokunma hedefleri en az **56×56 px**; tuş takımı başparmakla rahat kullanılmalı.
- Dikey telefon (360–430 px genişlik) birincil hedef; tablet ve masaüstünde de düzgün görünmeli (oyun alanı ortalanmış, maksimum genişlikli).
- Mobilde safe-area (çentik) boşluklarına dikkat et.
- Renk tek bilgi taşıyıcısı olmasın (ısı haritasında ikon veya yüzde de olsun; kilitli duraklarda kilit ikonu olsun).
- Çocuk karakteri, canavarlar ve köy sakinleri orijinal, sevimli SVG karakterler olmalı; canavarlar korkutucu değil komik olmalı.

---

## 9. Mobil Hazırlık

- Uygulama bir **PWA** olarak yayınlanabilir olmalı (manifest, ikonlar, service worker, offline).
- Kodda tarayıcıya özel API'ler (`localStorage`, `navigator.vibrate`, `AudioContext`) yalnızca `src/platform/` altında kullanılmalı.
- `docs/MOBILE.md` içinde Capacitor ile iOS ve Android'e geçiş adımlarını yaz: kurulum, `StorageAdapter`'ın Capacitor Preferences ile değiştirilmesi, Haptics eklentisi, ikon/splash, iOS'ta ses kilidi (ilk dokunuşta AudioContext'in açılması) gibi bilinen tuzaklar.
- Bu fazda Capacitor projesini **oluşturmak zorunlu değil**; ama mimari bunu engellememeli.

---

## 10. Test

- **Vitest birim testleri (zorunlu)** — motor mantığı için:
  - Bölüm çarpımları bölüm listesinden doğru hesaplanıyor: her çarpım tam olarak bir bölüme "yeni" olarak ait; 100 çarpımın tamamı kapsanıyor; önceki bölümde olan çarpım sonraki bölümde "yeni" sayılmıyor.
  - Kova kuralı: hiçbir çarpım, diğerleri aynı seviyeye gelmeden bir üst seviyeden tekrar seçilmiyor.
  - Bölüm geçme: tüm yeni çarpımlar hedef seviyeye ulaşınca bölüm tamamlanıyor; tekrar çarpımlarındaki hata bölümü engellemiyor.
  - Bölüm geçilmeden sonraki bölüm açılmıyor.
  - Tekrar oranı ve `minQuestionsPerLevel` doğru uygulanıyor.
  - Yıldız hesapları eşiklere göre doğru.
  - Yanlış cevap politikası (`reset` / `decrement`) doğru çalışıyor; yanlış bilinen çarpım 2–4 soru içinde tekrar soruluyor; süre bitmesi yanlış sayılıyor.
  - Final: tüm çarpımlar seviye 3 olunca bitiyor; dalga mesafe hesapları, kazanma/kaybetme koşulları; kaybedilen dalga ustalığı silmiyor.
  - Antrenman ağırlıklı seçimi zor çarpımları daha sık seçiyor (sabit seed ile).
  - Kayıt/yükleme, migration ve bölüm listesi değişikliğine dayanıklılık.
- **Playwright (temel):** Ana ekran → Macera → Harita → Bölüm 1'i oyna (test için config ile kısaltılmış) → haritada Bölüm 2'nin açıldığını gör → Özet ekranında verinin güncellendiğini gör.
- Rastgelelik için **seed verilebilen** bir RNG kullan (testler deterministik olsun).
- Geliştirme kolaylığı için yalnızca geliştirme ortamında görünen bir **debug paneli** ekle: bölümleri aç/kapat, ustalık seviyelerini ayarla, finali doğrudan başlat.

---

## 11. Dokümantasyon

Kaliteli dokümantasyon bu projenin bir gereksinimidir:

- **README.md:** Proje tanıtımı ve hikâye, ekran görüntüsü/GIF yer tutucuları, kurulum, çalıştırma, test, build, PWA olarak yükleme.
- **docs/GAME_DESIGN.md:** Oyun kurallarının güncel ve net hali; bölüm tablosu; tüm ayarlanabilir parametrelerin tablosu; yeni bölüm nasıl eklenir/sıralama nasıl değiştirilir.
- **docs/ARCHITECTURE.md:** Katmanlar (engine / platform / ui / screens), veri akışı diyagramı (Mermaid).
- **docs/DATA_MODEL.md:** Saklanan veri şeması ve sürümleme.
- **docs/MOBILE.md:** Bölüm 9'daki geçiş rehberi.
- **docs/ADDING_A_GAME.md:** Math Games platformuna ikinci bir oyun (ör. toplama) nasıl eklenir.
- **docs/DECISIONS.md:** Her önemli karar ve varsayım, kısa gerekçesiyle.
- Kod içinde: motor fonksiyonları için kısa JSDoc açıklamaları. Kod, değişken isimleri ve yorumlar **İngilizce**; dokümanlar ve arayüz metinleri **Türkçe**.

---

## 12. Geliştirme Aşamaları

Her aşamanın sonunda testleri çalıştır, çalışır durumda olduğundan emin ol ve anlamlı bir commit at.

1. **İskelet:** Vite + React + TS + Tailwind + Zustand + Vitest kurulumu, klasör yapısı, i18n, `StorageAdapter`, ana ekran.
2. **Motor:** `facts`, `levels` (bölüm çarpımlarının hesaplanması), `scheduler` (kova kuralı + tekrar oranı + yanlış tekrar kuyruğu), `mastery`, `stars`, `stats`, `battle`, seed'li RNG, tüm birim testleri.
3. **Bölüm oynanışı (görselsiz):** Soru akışı, tuş takımı, zamanlayıcı, bölüm geçme, kalıcı kayıt. Basit bir liste halinde bölümler arası ilerleme uçtan uca çalışmalı.
4. **Harita ekranı:** Dikey harita, duraklar, kilit/yıldız durumları, çantalı çocuk karakteri, kilit açılma ve patikada yürüme animasyonları, tepedeki okul.
5. **Bölüm sahnesi:** Yolda ilerleyen çocuk, doğru/yanlış animasyonları, combo, bölüm sonu kutlaması ve yıldız ekranı.
6. **Final:** Canavar savaşı, dalgalar, kazanma/kaybetme ekranları, okul bahçesine giriş sahnesi ve sertifika.
7. **Ses:** Web Audio tabanlı ses motoru, tüm efektler, ses aç/kapat, iOS ses kilidi çözümü.
8. **Antrenman modu** ve **Özet ekranı** (ısı haritası, tablo çubukları, "Bunları çalış").
9. **PWA**, ayarlar ekranı, debug paneli, reduce motion, erişilebilirlik kontrolleri.
10. **Dokümantasyonun tamamlanması** ve son gözden geçirme.

---

## 13. Kabul Kriterleri

- [ ] Uygulama telefonda dikey ekranda rahatça oynanıyor; tuş takımı başparmakla kullanılabiliyor.
- [ ] Macera kolaydan zora sıralı bölümlerden oluşuyor; bölüm geçilmeden sonraki açılmıyor.
- [ ] Bir bölüm, tüm yeni çarpımları en az 2 kez (config'e göre) doğru bilinince geçiliyor.
- [ ] Harita ekranında çantalı çocuk her bölüm geçişinde patika boyunca bir sonraki durağa yürüyor; hedef olan Matematik Okulu tepede baştan görünüyor.
- [ ] Final bölümde canavar savaşı var; tüm çarpımlar seviye 3 olunca okul kapısı açılıyor, okul bahçesi sahnesi ve sertifika gösteriliyor.
- [ ] Yanlışta doğru cevap gösteriliyor, ustalık politikası config'e göre çalışıyor.
- [ ] Doğru/yanlış cevaplarda belirgin, birbirinden farklı ses ve animasyon var.
- [ ] Uygulama kapatılıp açıldığında bölüm ilerlemesi, yıldızlar ve istatistikler korunuyor.
- [ ] Antrenman modu zorlanılan çarpımları daha sık soruyor.
- [ ] Özet ekranında ısı haritası ve en zor çarpımlar doğru görünüyor.
- [ ] İnternet bağlantısı olmadan çalışıyor (PWA).
- [ ] Tüm birim testleri geçiyor; `npm run build` hatasız.
- [ ] Bölüm 11'deki dokümanların hepsi mevcut ve güncel.
- [ ] Telif hakkı olan hiçbir karakter, görsel veya ses yok.

---

## 14. Kapsam Dışı (bu faz)

- Backend, hesap sistemi, bulut senkronizasyonu
- Çoklu profil arayüzü (veri modeli hazır olacak, arayüz sonra)
- Çarpım tablosu dışındaki oyunlar
- Mağaza yayını (App Store / Play Store)
