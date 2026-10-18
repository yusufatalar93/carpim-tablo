import type { GameConfig } from './engine/config';

/** Default, tunable parameters of the multiplication game. See docs/GAME_DESIGN.md. */
export const defaultConfig: GameConfig = {
  minFactor: 1,
  maxFactor: 10,
  treatCommutativeAsSame: false,
  maxMastery: 3,
  levelPassMastery: 2,
  finalMastery: 3,
  wrongAnswerPolicy: 'reset',
  reviewRatio: 0.25,
  maxReviewRatio: 0.6,
  minQuestionsPerLevel: 20,
  recentExclusion: 3,
  retryAfterMin: 2,
  retryAfterMax: 4,
  timeLimitsMs: { easy: 8000, normal: 5000, hard: 3000 },
  urgentMs: 2000,
  wrongRevealMs: 1500,
  countdownFrom: 3,
  stars: { threeAccuracy: 0.9, threeAvgMs: 3000, twoAccuracy: 0.75 },
  weight: { base: 1, errorRateFactor: 3, slowMs: 3000, slowBonus: 1, notMasteredBonus: 1, unseenWeight: 2.5 },
  battle: { start: 50, max: 100, hit: 8, fastHit: 12, miss: 12, bossPushMultiplier: 0.5, bossThreshold: 10 },
  practice: { roundLengths: [10, 20, 30], defaultLength: 20, timerDefaultOn: false },
};

/**
 * Shortened config for automated end-to-end tests and quick manual checks.
 * Enabled with `?fast=1` in the URL (dev and preview builds).
 */
export const fastConfig: GameConfig = {
  ...defaultConfig,
  levelPassMastery: 1,
  finalMastery: 2,
  countdownFrom: 1,
  wrongRevealMs: 300,
};

function readFastFlag(): boolean {
  try {
    return typeof location !== 'undefined' && new URLSearchParams(location.search).has('fast');
  } catch {
    return false;
  }
}

export const config: GameConfig = readFastFlag() ? fastConfig : defaultConfig;
