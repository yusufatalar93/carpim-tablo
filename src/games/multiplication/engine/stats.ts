import type { GameConfig } from './config';
import type { FactStats, FactStatsMap } from './types';

/** Smoothing factor of the moving average for response times. */
export const RESPONSE_EMA_ALPHA = 0.3;

/** Returns updated per-fact statistics after an answer (does not touch mastery). */
export function recordStats(stats: FactStats, correct: boolean, responseMs: number, now: number): FactStats {
  const next: FactStats = { ...stats, attempts: stats.attempts + 1, lastSeenAt: now };
  if (correct) {
    next.correct = stats.correct + 1;
    next.avgResponseMs =
      stats.correct === 0 ? responseMs : Math.round(stats.avgResponseMs + RESPONSE_EMA_ALPHA * (responseMs - stats.avgResponseMs));
  } else {
    next.wrong = stats.wrong + 1;
  }
  return next;
}

export function errorRate(stats: FactStats): number {
  return stats.attempts === 0 ? 0 : stats.wrong / stats.attempts;
}

/**
 * Weakness weight: 1 + 3 × errorRate + (avg > 3s ? 1 : 0) + (mastery < 3 ? 1 : 0).
 * Unseen facts get a medium weight. Used by practice mode and adventure review selection.
 */
export function weaknessWeight(stats: FactStats, config: Pick<GameConfig, 'weight' | 'maxMastery'>): number {
  const w = config.weight;
  if (stats.attempts === 0) return w.unseenWeight;
  return (
    w.base +
    w.errorRateFactor * errorRate(stats) +
    (stats.correct > 0 && stats.avgResponseMs > w.slowMs ? w.slowBonus : 0) +
    (stats.mastery < config.maxMastery ? w.notMasteredBonus : 0)
  );
}

export type FactHealth = 'unseen' | 'struggling' | 'medium' | 'good';

/** Classification for the summary heatmap. */
export function factHealth(stats: FactStats): FactHealth {
  if (stats.attempts === 0) return 'unseen';
  const acc = stats.correct / stats.attempts;
  if (acc >= 0.85 && stats.mastery >= 2) return 'good';
  if (acc >= 0.6) return 'medium';
  return 'struggling';
}

export interface Totals {
  attempts: number;
  correct: number;
  accuracy: number;
  avgResponseMs: number;
}

export function totals(facts: FactStatsMap): Totals {
  let attempts = 0;
  let correct = 0;
  let msSum = 0;
  for (const s of Object.values(facts)) {
    attempts += s.attempts;
    correct += s.correct;
    msSum += s.avgResponseMs * s.correct;
  }
  return {
    attempts,
    correct,
    accuracy: attempts ? correct / attempts : 0,
    avgResponseMs: correct ? Math.round(msSum / correct) : 0,
  };
}

/** Accuracy per table (1..max): facts that involve the table. */
export function tableAccuracy(facts: FactStatsMap, table: number): { attempts: number; accuracy: number } {
  let attempts = 0;
  let correct = 0;
  for (const s of Object.values(facts)) {
    if (s.a !== table && s.b !== table) continue;
    attempts += s.attempts;
    correct += s.correct;
  }
  return { attempts, accuracy: attempts ? correct / attempts : 0 };
}

/** The hardest seen facts, by weakness weight (desc), then error rate. */
export function hardestFacts(facts: FactStatsMap, count: number, config: Pick<GameConfig, 'weight' | 'maxMastery'>): FactStats[] {
  return Object.values(facts)
    .filter((s) => s.attempts > 0 && s.wrong > 0)
    .sort((x, y) => weaknessWeight(y, config) - weaknessWeight(x, config) || errorRate(y) - errorRate(x) || y.wrong - x.wrong)
    .slice(0, count);
}
