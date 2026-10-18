# Mimari

## Katmanlar

| Katman | Klasör | Sorumluluk | Bağımlılık kuralı |
|---|---|---|---|
| **Engine** | `src/games/multiplication/engine/` | Saf TypeScript oyun mantığı: çarpımlar, bölüm hesapları, soru seçici, ustalık, yıldız, istatistik, savaş, ilerleme, kayıt doğrulama/migration, oturum (`GameSession`) | React, DOM, `localStorage` **yok**. Rastgelelik yalnızca enjekte edilen seed'li `Rng` ile. |
| **Platform** | `src/platform/` | `StorageAdapter` (localStorage / bellek), Web Audio ses motoru, haptik, reduced-motion tespiti, id üretimi | Tarayıcıya özel API'ler **yalnızca** burada. Mobilde bu katman değiştirilir. |
| **UI kit** | `src/ui/` | Ortak bileşenler: `Button`, `Keypad`, `Modal`, `Stars`, `ProgressBar`, `Toggle`, `Segmented`, `HoldButton`, `Screen`, efektler (konfeti) | Oyundan bağımsız. |
| **i18n** | `src/i18n/` | `tr.json` + `t(key, params)` | Bileşenlerde metin gömülmez (debug paneli hariç). |
| **Oyun UI** | `src/games/multiplication/{components,screens,play}` | SVG karakterler ve sahneler, oyun döngüsü kancası (`useGameLoop`), ekranlar | Engine'i ve store'u kullanır. |
| **Store** | `src/games/multiplication/store.ts` | Zustand: kayıt (`MultiplicationSave`), geçici harita animasyonu, debounce'lu kaydetme | Platform `storage` üzerinden yazar. |
| **App** | `src/app/` | Hash router, hub (oyun seçimi), ilk açılış, ayarlar, profil, debug paneli | |

## Veri akışı

```mermaid
flowchart LR
  subgraph UI[React UI]
    S[Screens<br/>Level / Final / Practice]
    L[useGameLoop<br/>geri sayım, zamanlayıcı, giriş]
    V[Sahne bileşenleri<br/>Kid, Monster, WorldMap]
  end
  subgraph ENG[Engine - saf TS]
    GS[GameSession]
    SC[QuestionScheduler]
    M[mastery / stats / stars / battle]
    P[progress / save]
  end
  ST[(Zustand store<br/>MultiplicationSave)]
  PL[Platform<br/>StorageAdapter / Audio / Haptics]
  DISK[(localStorage<br/>veya Capacitor Preferences)]

  S -->|createLevelSession(facts)| GS
  L -->|nextQuestion / answer| GS
  GS --> SC
  GS --> M
  L -->|AnswerResult| S
  S -->|setFacts / finishLevel| ST
  ST -->|completeLevel, loadSaveData| P
  ST -->|debounced set| PL --> DISK
  S -->|playSound / haptics| PL
  ST -->|save| S --> V
```

1. Ekran açılınca store'daki `facts` ile bir `GameSession` oluşturulur (devam etme desteği bu sayede doğal).
2. `useGameLoop` soruyu `session.nextQuestion()` ile alır, zamanlayıcıyı yönetir, cevabı `session.answer()`'a verir.
3. Dönen `AnswerResult` (doğru mu, kombo, bölüm geçildi mi, savaş durumu) ekranda ses/animasyona çevrilir.
4. Her cevaptan sonra `session.facts` store'a yazılır; store 250 ms debounce ile `StorageAdapter`'a kaydeder.
   Sayfa gizlenince/kapanınca (`visibilitychange`, `pagehide`) bekleyen kayıt hemen yazılır.

## Klasör yapısı

```
src/
├── app/            App, router, HubScreen, OnboardingScreen, SettingsScreen, profile, games (kayıt), DebugPanel
├── platform/       storage, audio, haptics, motion, id
├── ui/             ortak bileşenler + effects
├── i18n/           tr.json, index.ts
└── games/multiplication/
    ├── engine/     types, config (tip), rng, facts, levels, scheduler, mastery, stats, stars, battle, progress, save, session
    ├── components/ Kid, Monster, Person, StopArt, WorldMap, LevelScene, BattleScene, TimerRing, Heatmap
    ├── play/       useGameLoop, PlayView
    ├── screens/    Menu, Map, Level, Final, School, Practice, Summary
    ├── config.ts   varsayılan parametreler (+ fastConfig)
    ├── levels.ts   bölüm listesi (veri)
    ├── data.ts     bölüm listesinden türetilen statik veri
    ├── sounds.ts   sentezlenmiş ses efektleri
    ├── hooks.ts
    └── store.ts
tests/
├── unit/           Vitest — motor
└── e2e/            Playwright — temel akış
```

## Performans notları

- Zamanlayıcı halkası `requestAnimationFrame` ile doğrudan DOM'u günceller (her karede React render yok).
- Animasyonlar transform/opacity tabanlı (Framer Motion). `prefers-reduced-motion` veya ayardaki
  "Hareketleri azalt" açıkken `MotionConfig reducedMotion="always"`, CSS animasyonları kapalı, konfeti yok.
- SVG'de Framer Motion dönüş merkezi (`originX/originY`) kullanılırken `transformBox` **verilmemelidir**;
  Framer kendi hesapladığı mutlak orijini kullanır.
