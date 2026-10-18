import type { AdventureState, LevelDef, LevelProgress } from './types';

/** Fresh adventure: first level unlocked, all others locked. */
export function createAdventure(levels: readonly LevelDef[]): AdventureState {
  return reconcileAdventure(null, levels);
}

/**
 * Makes a (possibly old or corrupt) adventure state consistent with the current level list:
 * unknown level ids are dropped, new levels are added, completed levels stay completed, and any
 * other level is unlocked only when the level right before it is completed (or it is the first).
 */
export function reconcileAdventure(saved: unknown, levels: readonly LevelDef[]): AdventureState {
  const src = (saved && typeof saved === 'object' ? saved : {}) as Partial<AdventureState>;
  const savedLevels = (src.levels && typeof src.levels === 'object' ? src.levels : {}) as Record<string, Partial<LevelProgress>>;
  const out: Record<string, LevelProgress> = {};
  let prevCompleted = true;
  for (const level of levels) {
    const s = savedLevels[level.id] ?? {};
    const completed = s.status === 'completed';
    const stars = [0, 1, 2, 3].includes(s.bestStars as number) ? (s.bestStars as 0 | 1 | 2 | 3) : 0;
    out[level.id] = {
      levelId: level.id,
      status: completed ? 'completed' : prevCompleted ? 'unlocked' : 'locked',
      bestStars: completed ? stars : 0,
      ...(completed && typeof s.bestAccuracy === 'number' ? { bestAccuracy: s.bestAccuracy } : {}),
      ...(completed && typeof s.completedAt === 'number' ? { completedAt: s.completedAt } : {}),
    };
    prevCompleted = completed;
  }
  const finalSrc = (src.final && typeof src.final === 'object' ? src.final : {}) as Partial<AdventureState['final']>;
  let currentLevelId = typeof src.currentLevelId === 'string' ? src.currentLevelId : '';
  if (!out[currentLevelId] || out[currentLevelId].status === 'locked') currentLevelId = frontierLevelId(out, levels);
  return {
    levels: out,
    currentLevelId,
    final: {
      wavesWon: typeof finalSrc.wavesWon === 'number' && finalSrc.wavesWon >= 0 ? Math.floor(finalSrc.wavesWon) : 0,
      ...(typeof finalSrc.completedAt === 'number' ? { completedAt: finalSrc.completedAt } : {}),
    },
  };
}

/** The first unlocked-but-not-completed level, or the last level if everything is done. */
export function frontierLevelId(state: Record<string, LevelProgress>, levels: readonly LevelDef[]): string {
  const open = levels.find((l) => state[l.id]?.status === 'unlocked');
  return (open ?? levels[levels.length - 1]).id;
}

export function nextLevelId(levels: readonly LevelDef[], levelId: string): string | null {
  const i = levels.findIndex((l) => l.id === levelId);
  return i >= 0 && i + 1 < levels.length ? levels[i + 1].id : null;
}

export function isPlayable(adventure: AdventureState, levelId: string): boolean {
  const s = adventure.levels[levelId]?.status;
  return s === 'unlocked' || s === 'completed';
}

export interface CompleteResult {
  adventure: AdventureState;
  /** Level that became unlocked by this completion (null on replay or last level). */
  unlockedLevelId: string | null;
  improved: boolean;
}

/** Marks a level completed (keeping the best stars) and unlocks the next one. */
export function completeLevel(
  adventure: AdventureState,
  levels: readonly LevelDef[],
  levelId: string,
  stars: 1 | 2 | 3,
  accuracy: number,
  now: number,
): CompleteResult {
  const prev = adventure.levels[levelId];
  if (!prev || prev.status === 'locked') return { adventure, unlockedLevelId: null, improved: false };
  const improved = stars > prev.bestStars;
  const levelsState = { ...adventure.levels };
  levelsState[levelId] = {
    levelId,
    status: 'completed',
    bestStars: Math.max(prev.bestStars, stars) as 1 | 2 | 3,
    bestAccuracy: Math.max(prev.bestAccuracy ?? 0, accuracy),
    completedAt: prev.completedAt ?? now,
  };
  const next = nextLevelId(levels, levelId);
  let unlockedLevelId: string | null = null;
  let currentLevelId = adventure.currentLevelId;
  if (next && levelsState[next]?.status === 'locked') {
    levelsState[next] = { ...levelsState[next], status: 'unlocked' };
    unlockedLevelId = next;
    currentLevelId = next;
  }
  const isFinal = levels.find((l) => l.id === levelId)?.isFinal;
  const final = isFinal && !adventure.final.completedAt ? { ...adventure.final, completedAt: now } : adventure.final;
  return { adventure: { ...adventure, levels: levelsState, currentLevelId, final }, unlockedLevelId, improved };
}

export function completedCount(adventure: AdventureState): number {
  return Object.values(adventure.levels).filter((l) => l.status === 'completed').length;
}

export function totalStars(adventure: AdventureState): number {
  return Object.values(adventure.levels).reduce((n, l) => n + l.bestStars, 0);
}
