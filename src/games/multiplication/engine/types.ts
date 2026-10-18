/** Shared engine types. Pure data — no React / DOM dependencies. */

export type Mastery = 0 | 1 | 2 | 3;
export type WrongAnswerPolicy = 'reset' | 'decrement';
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface Fact {
  id: string; // "7x8"
  a: number;
  b: number;
}

export interface FactStats {
  id: string;
  a: number;
  b: number;
  mastery: Mastery;
  attempts: number;
  correct: number;
  wrong: number; // includes timeouts
  avgResponseMs: number; // correct answers only, moving average
  lastSeenAt?: number;
}

export type FactStatsMap = Record<string, FactStats>;

export interface LevelDef {
  id: string;
  /** i18n key suffix for the stop name, e.g. "home" -> levels.home */
  nameKey: string;
  /** Tables newly taught in this level. Ignored for the final level. */
  tables: number[];
  /** Visual theme of the stop on the map / in the scene. */
  scene: 'home' | 'mill' | 'bridge' | 'orchard' | 'forest' | 'waterfall' | 'pass' | 'school';
  isFinal?: boolean;
}

export type LevelStatus = 'locked' | 'unlocked' | 'completed';

export interface LevelProgress {
  levelId: string;
  status: LevelStatus;
  bestStars: 0 | 1 | 2 | 3;
  bestAccuracy?: number;
  completedAt?: number;
}

export interface AdventureState {
  levels: Record<string, LevelProgress>;
  currentLevelId: string;
  final: {
    wavesWon: number;
    completedAt?: number;
  };
}

export interface Settings {
  soundOn: boolean;
  reduceMotion: boolean;
  difficulty: Difficulty;
}

export interface MultiplicationSave {
  schemaVersion: 1;
  profileId: string;
  facts: FactStatsMap;
  adventure: AdventureState;
  settings: Settings;
}
