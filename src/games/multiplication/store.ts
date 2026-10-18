import { create } from 'zustand';
import { storage } from '../../platform';
import { config } from './config';
import {
  completeLevel as completeLevelEngine,
  createSave,
  loadSaveData,
  type FactStatsMap,
  type Mastery,
  type MultiplicationSave,
  type Settings,
} from './engine';
import { levels } from './levels';

const saveKey = (profileId: string) => `multiplication:${profileId}`;

export interface PendingWalk {
  from: string;
  to: string;
}

interface MultiplicationState {
  save: MultiplicationSave | null;
  /** Transient (not saved): the map should play unlock + walk animations. */
  pendingWalk: PendingWalk | null;
  load(profileId: string): Promise<void>;
  setFacts(facts: FactStatsMap): void;
  finishLevel(levelId: string, stars: 1 | 2 | 3, accuracy: number): { unlockedLevelId: string | null; improved: boolean; previousStars: number };
  winWave(): void;
  setSettings(patch: Partial<Settings>): void;
  clearPendingWalk(): void;
  resetProgress(): void;
  /** Dev tools. */
  debug: {
    setAllMastery(m: Mastery): void;
    unlockAll(): void;
    completeUpTo(levelId: string): void;
    lockAll(): void;
  };
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function persistSoon(save: MultiplicationSave | null): void {
  if (!save) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void storage.set(saveKey(save.profileId), save);
  }, 250);
}

/** Writes pending changes immediately (called when the page is hidden/closed). */
export function flushSave(): void {
  const save = useMultiplication.getState().save;
  if (saveTimer && save) {
    clearTimeout(saveTimer);
    saveTimer = null;
    void storage.set(saveKey(save.profileId), save);
  }
}

export const useMultiplication = create<MultiplicationState>((set, get) => {
  const update = (fn: (s: MultiplicationSave) => MultiplicationSave) => {
    const save = get().save;
    if (!save) return;
    const next = fn(save);
    set({ save: next });
    persistSoon(next);
  };

  return {
    save: null,
    pendingWalk: null,

    async load(profileId) {
      const raw = await storage.get<unknown>(saveKey(profileId));
      const save = raw === null ? createSave(profileId, levels, config) : loadSaveData(raw, profileId, levels, config);
      set({ save });
      persistSoon(save);
    },

    setFacts(facts) {
      update((s) => ({ ...s, facts }));
    },

    finishLevel(levelId, stars, accuracy) {
      const save = get().save;
      if (!save) return { unlockedLevelId: null, improved: false, previousStars: 0 };
      const previousStars = save.adventure.levels[levelId]?.bestStars ?? 0;
      const r = completeLevelEngine(save.adventure, levels, levelId, stars, accuracy, Date.now());
      update((s) => ({ ...s, adventure: r.adventure }));
      if (r.unlockedLevelId) set({ pendingWalk: { from: levelId, to: r.unlockedLevelId } });
      return { unlockedLevelId: r.unlockedLevelId, improved: r.improved, previousStars };
    },

    winWave() {
      update((s) => ({ ...s, adventure: { ...s.adventure, final: { ...s.adventure.final, wavesWon: s.adventure.final.wavesWon + 1 } } }));
    },

    setSettings(patch) {
      update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
    },

    clearPendingWalk() {
      set({ pendingWalk: null });
    },

    resetProgress() {
      update((s) => ({ ...createSave(s.profileId, levels, config), settings: s.settings }));
      set({ pendingWalk: null });
    },

    debug: {
      setAllMastery(m) {
        update((s) => ({
          ...s,
          facts: Object.fromEntries(Object.entries(s.facts).map(([id, f]) => [id, { ...f, mastery: m }])),
        }));
      },
      unlockAll() {
        update((s) => ({
          ...s,
          adventure: {
            ...s.adventure,
            levels: Object.fromEntries(
              Object.entries(s.adventure.levels).map(([id, l]) => [id, l.status === 'locked' ? { ...l, status: 'unlocked' as const } : l]),
            ),
          },
        }));
      },
      completeUpTo(levelId) {
        const idx = levels.findIndex((l) => l.id === levelId);
        let save = get().save;
        if (!save || idx < 0) return;
        let adventure = save.adventure;
        for (const l of levels.slice(0, idx + 1)) {
          adventure = completeLevelEngine(adventure, levels, l.id, 3, 1, Date.now()).adventure;
        }
        save = { ...save, adventure };
        set({ save });
        persistSoon(save);
      },
      lockAll() {
        update((s) => ({ ...s, adventure: createSave(s.profileId, levels, config).adventure }));
      },
    },
  };
});
