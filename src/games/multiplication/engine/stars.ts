import type { GameConfig } from './config';

/** Stars (1..3) for a passed level from accuracy (0..1) and average response time of correct answers. */
export function computeStars(accuracy: number, avgResponseMs: number, config: Pick<GameConfig, 'stars'>): 1 | 2 | 3 {
  const s = config.stars;
  if (accuracy >= s.threeAccuracy && avgResponseMs < s.threeAvgMs) return 3;
  if (accuracy >= s.twoAccuracy) return 2;
  return 1;
}
