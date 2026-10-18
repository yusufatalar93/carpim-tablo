# Platforma Yeni Oyun Ekleme

Örnek: **Toplama Yarışı** (`addition`).

## 1. Klasörü oluşturun

Çarpım oyunundaki yapıyı izleyin:

```
src/games/addition/
├── engine/       # saf TS: soru üretimi, ustalık, oturum — React/DOM yok
├── components/
├── screens/
├── config.ts
├── store.ts
└── sounds.ts
```

Yeniden kullanılabilecekler:

- `src/platform/*` — depolama, ses motoru (`sound.play(spec)`), haptik
- `src/ui/*` — `Button`, `Keypad`, `Modal`, `Stars`, `ProgressBar`, `Screen`, efektler
- `src/games/multiplication/play/useGameLoop.ts` ve `PlayView.tsx` — geri sayım, zamanlayıcı, tuş takımı
  akışı. Yeni oyun aynı `GameSession` arayüzünü (`nextQuestion`, `answer`, `isComplete`, `timeLimitMs`)
  sağlarsa doğrudan kullanılabilir. İki oyun bunu paylaşmaya başladığında `src/games/shared/` altına taşıyın.
- `engine/rng.ts`, `engine/stats.ts` — seed'li RNG ve istatistik yardımcıları.

## 2. Kayıt

- Ayrı bir anahtar kullanın: `addition:<profileId>`. Kendi `schemaVersion` ve migration'larınızı tutun
  (bkz. [DATA_MODEL.md](DATA_MODEL.md)).
- Tüm okuma/yazma `storage` (`src/platform`) üzerinden olmalı.

## 3. Metinler

`src/i18n/tr.json` içine `addition` bölümü ekleyin; hub kartı için `hub.games.addition.title/desc` zaten var.

## 4. Yönlendirme

`src/app/router.ts`:

```ts
| { name: 'add-menu' }
// parseHash: if (parts[0] === 'add') return { name: 'add-menu' };
```

`src/app/App.tsx` → `renderRoute` içine ekranları ekleyin ve kaydı `useBoot` içinde yükleyin.

## 5. Hub kartını açın

`src/app/games.ts`:

```ts
{ id: 'addition', i18nKey: 'hub.games.addition', emoji: '➕', route: '/add', color: 'from-emerald-400 to-teal-500' },
```

`route: null` olan kartlar "Yakında" olarak gri gösterilir.

## 6. Test ve doküman

- Motor için `tests/unit/addition/*.test.ts` (Vitest, seed'li RNG ile deterministik).
- Temel akış için `tests/e2e/` altına bir Playwright senaryosu.
- Kuralları `docs/` altında bir tasarım dokümanında, kararları `docs/DECISIONS.md`'de belgeleyin.
