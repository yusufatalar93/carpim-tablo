import type { GameConfig } from './config';
import { allFacts, emptyStats } from './facts';
import { reconcileAdventure } from './progress';
import type { Difficulty, FactStats, FactStatsMap, LevelDef, Mastery, MultiplicationSave, Settings } from './types';

export const SCHEMA_VERSION = 1 as const;

export const DEFAULT_SETTINGS: Settings = { soundOn: true, reduceMotion: false, difficulty: 'normal' };

/** Migration from version N to N+1. */
export type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

/**
 * Registered migrations, keyed by the version they migrate FROM.
 * Example for a future v2: `1: (d) => ({ ...d, schemaVersion: 2, newField: ... })`.
 */
export const MIGRATIONS: Record<number, Migration> = {};

export function createSave(profileId: string, levels: readonly LevelDef[], config: GameConfig): MultiplicationSave {
  return sanitizeSave({}, profileId, levels, config);
}

/**
 * Runs migrations until the data is at the target version.
 * Returns null if the data cannot be migrated (unknown/newer version or broken migration).
 */
export function migrateSave(
  raw: unknown,
  migrations: Record<number, Migration> = MIGRATIONS,
  target: number = SCHEMA_VERSION,
): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  let data = raw as Record<string, unknown>;
  let version = typeof data.schemaVersion === 'number' ? data.schemaVersion : 0;
  while (version < target) {
    const m = migrations[version];
    if (!m) return null;
    try {
      data = m(data);
    } catch {
      return null;
    }
    const nextVersion = typeof data.schemaVersion === 'number' ? data.schemaVersion : NaN;
    if (!(nextVersion > version)) return null;
    version = nextVersion;
  }
  return version === target ? data : null;
}

/**
 * Turns any input into a valid save for the current level list and fact range.
 * Never throws: broken parts fall back to defaults.
 */
export function sanitizeSave(raw: unknown, profileId: string, levels: readonly LevelDef[], config: GameConfig): MultiplicationSave {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof MultiplicationSave, unknown>>;
  return {
    schemaVersion: SCHEMA_VERSION,
    profileId: typeof src.profileId === 'string' && src.profileId ? src.profileId : profileId,
    facts: sanitizeFacts(src.facts, config),
    adventure: reconcileAdventure(src.adventure, levels),
    settings: sanitizeSettings(src.settings),
  };
}

/** Parses a stored value (after migration) or returns a fresh save. */
export function loadSaveData(raw: unknown, profileId: string, levels: readonly LevelDef[], config: GameConfig): MultiplicationSave {
  const migrated = migrateSave(raw);
  return sanitizeSave(migrated ?? {}, profileId, levels, config);
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fallback;
}

function sanitizeFacts(raw: unknown, config: GameConfig): FactStatsMap {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, Partial<FactStats>>;
  const out: FactStatsMap = {};
  for (const f of allFacts(config)) {
    const s = src[f.id];
    if (!s || typeof s !== 'object') {
      out[f.id] = emptyStats(f);
      continue;
    }
    const mastery = [0, 1, 2, 3].includes(s.mastery as number) ? (s.mastery as Mastery) : 0;
    const correct = Math.floor(num(s.correct));
    const wrong = Math.floor(num(s.wrong));
    out[f.id] = {
      ...emptyStats(f),
      mastery,
      correct,
      wrong,
      attempts: Math.max(Math.floor(num(s.attempts)), correct + wrong),
      avgResponseMs: num(s.avgResponseMs),
      ...(typeof s.lastSeenAt === 'number' ? { lastSeenAt: s.lastSeenAt } : {}),
    };
  }
  return out;
}

function sanitizeSettings(raw: unknown): Settings {
  const s = (raw && typeof raw === 'object' ? raw : {}) as Partial<Settings>;
  const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];
  return {
    soundOn: typeof s.soundOn === 'boolean' ? s.soundOn : DEFAULT_SETTINGS.soundOn,
    reduceMotion: typeof s.reduceMotion === 'boolean' ? s.reduceMotion : DEFAULT_SETTINGS.reduceMotion,
    difficulty: difficulties.includes(s.difficulty as Difficulty) ? (s.difficulty as Difficulty) : DEFAULT_SETTINGS.difficulty,
  };
}
