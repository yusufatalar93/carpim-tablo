import type { GameConfig } from './config';
import type { FactStatsMap, Mastery } from './types';

/** Returns the new mastery after an answer, according to the wrong-answer policy. */
export function nextMastery(
  current: Mastery,
  correct: boolean,
  config: Pick<GameConfig, 'wrongAnswerPolicy' | 'maxMastery'>,
): Mastery {
  if (correct) return Math.min(config.maxMastery, current + 1) as Mastery;
  if (config.wrongAnswerPolicy === 'decrement') return Math.max(0, current - 1) as Mastery;
  return 0;
}

/** True when every listed fact has at least the target mastery. */
export function allReached(factIds: readonly string[], facts: FactStatsMap, target: number): boolean {
  return factIds.every((id) => (facts[id]?.mastery ?? 0) >= target);
}

/** Number of listed facts that reached the target mastery. */
export function countReached(factIds: readonly string[], facts: FactStatsMap, target: number): number {
  return factIds.reduce((n, id) => n + ((facts[id]?.mastery ?? 0) >= target ? 1 : 0), 0);
}

/** Correct answers still needed (in the best case) for all listed facts to reach the target. */
export function remainingSteps(factIds: readonly string[], facts: FactStatsMap, target: number): number {
  return factIds.reduce((n, id) => n + Math.max(0, target - (facts[id]?.mastery ?? 0)), 0);
}
