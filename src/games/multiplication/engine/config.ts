import type { Difficulty, WrongAnswerPolicy } from './types';

/** All tunable game parameters. The default instance lives in ../config.ts. */
export interface GameConfig {
  minFactor: number;
  maxFactor: number;
  /** If true, 7x8 and 8x7 are one fact (stored as the smaller-first id). */
  treatCommutativeAsSame: boolean;
  maxMastery: 3;
  /** Mastery every new fact of a normal level must reach to pass it. */
  levelPassMastery: number;
  /** Mastery every fact must reach to finish the final. */
  finalMastery: number;
  wrongAnswerPolicy: WrongAnswerPolicy;
  /** Share of questions in a normal level that are review facts from earlier levels. */
  reviewRatio: number;
  /** Upper bound when the review ratio is raised to satisfy minQuestionsPerLevel. */
  maxReviewRatio: number;
  minQuestionsPerLevel: number;
  /** The last N asked facts are not picked again (if the pool allows). */
  recentExclusion: number;
  /** A wrongly answered fact is asked again after this many other questions (inclusive range). */
  retryAfterMin: number;
  retryAfterMax: number;
  timeLimitsMs: Record<Difficulty, number>;
  /** Timer turns "urgent" (colour + tick) in the last N ms. */
  urgentMs: number;
  wrongRevealMs: number;
  countdownFrom: number;
  stars: {
    threeAccuracy: number;
    threeAvgMs: number;
    twoAccuracy: number;
  };
  /** Weakness weight used by practice mode and review selection. */
  weight: {
    base: number;
    errorRateFactor: number;
    slowMs: number;
    slowBonus: number;
    notMasteredBonus: number;
    unseenWeight: number;
  };
  battle: {
    start: number;
    max: number;
    hit: number;
    fastHit: number;
    miss: number;
    /** Pushes are multiplied by this against the big final monster (tougher boss). */
    bossPushMultiplier: number;
    /** The boss appears once at most this many correct answers are still needed. */
    bossThreshold: number;
  };
  practice: {
    roundLengths: number[];
    defaultLength: number;
    timerDefaultOn: boolean;
  };
}
