# Veri Modeli

Tüm veri cihazda tutulur. Cevap geçmişi **tutulmaz**; yalnızca çarpım başına özet istatistik ve ilerleme.
Tipik kayıt boyutu ~15 KB.

## Anahtarlar

`StorageAdapter` web'de `localStorage`'ı `mg:` önekiyle kullanır.

| Anahtar | İçerik |
|---|---|
| `mg:profiles` | `ProfilesData` — profil listesi, aktif profil, ilk açılış tamamlandı mı |
| `mg:multiplication:<profileId>` | `MultiplicationSave` — çarpım oyunu kaydı |

Çoklu profil arayüzü bu fazda yok, ama veri modeli hazır: her profilin kendi oyun kaydı vardır.

## Şema

```ts
interface ProfilesData {
  activeId: string;
  profiles: PlayerProfile[];
  onboarded: boolean;
}

interface PlayerProfile {
  id: string;
  name?: string;
  createdAt: number;
}

interface MultiplicationSave {
  schemaVersion: 1;
  profileId: string;
  facts: Record<string, FactStats>; // "7x8" → istatistik
  adventure: {
    levels: Record<string, LevelProgress>;
    currentLevelId: string; // haritada çocuğun durduğu durak
    final: { wavesWon: number; completedAt?: number };
  };
  settings: { soundOn: boolean; reduceMotion: boolean; difficulty: 'easy' | 'normal' | 'hard' };
}

interface FactStats {
  id: string; a: number; b: number;
  mastery: 0 | 1 | 2 | 3;  // global ustalık (antrenman değiştirmez)
  attempts: number;
  correct: number;
  wrong: number;            // süre bitmesi dahil
  avgResponseMs: number;    // yalnızca doğru cevaplar, kayan ortalama (EMA, α = 0.3)
  lastSeenAt?: number;
}

interface LevelProgress {
  levelId: string;
  status: 'locked' | 'unlocked' | 'completed';
  bestStars: 0 | 1 | 2 | 3;
  bestAccuracy?: number;
  completedAt?: number;
}
```

## Yükleme hattı

`loadSaveData(raw)` (`engine/save.ts`):

1. **`migrateSave`** — `schemaVersion`'a bakar, `MIGRATIONS[v]` fonksiyonlarını sırayla uygular
   (`v → v+1`). Bilinmeyen/daha yeni sürüm, eksik migration ya da hata fırlatan migration → `null`
   (varsayılan kayda dönülür, uygulama çökmez).
2. **`sanitizeSave`** — her alanı doğrular:
   - Geçerli aralıktaki her çarpım için kayıt garanti edilir; eksikler sıfırdan eklenir, aralık dışı/bozuk
     kayıtlar atılır, geçersiz sayılar düzeltilir (`attempts ≥ correct + wrong` vb.).
   - Ayarlarda geçersiz değerler varsayılana döner.
   - **`reconcileAdventure`** — bölüm listesiyle eşleştirme:
     - bilinmeyen `levelId`'ler yok sayılır;
     - `completed` bölümler korunur;
     - diğer bölümler yalnızca bir önceki tamamlanmışsa `unlocked`, değilse `locked`;
     - `currentLevelId` geçersiz veya kilitliyse ilk açık bölüme taşınır.

Okunamayan JSON veya erişilemeyen depolama (`localStorage` kapalı/gizli mod) da boş kayıt gibi ele alınır;
depolama hiç yoksa `MemoryStorageAdapter` kullanılır.

## Yeni sürüm ekleme (örnek)

```ts
// engine/types.ts: schemaVersion: 2
// engine/save.ts
export const SCHEMA_VERSION = 2 as const;
export const MIGRATIONS: Record<number, Migration> = {
  1: (d) => ({ ...d, schemaVersion: 2, settings: { ...(d.settings as object), music: true } }),
};
```

Ardından `sanitizeSave`'e yeni alanın doğrulamasını ekleyin ve `tests/unit/save.test.ts`'e bir test yazın.
