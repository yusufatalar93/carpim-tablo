import { config } from './config';
import { useMultiplication } from './store';

/** Per-question time limit from the difficulty setting. */
export function useTimeLimit(): number {
  const difficulty = useMultiplication((s) => s.save?.settings.difficulty ?? 'normal');
  return config.timeLimitsMs[difficulty];
}

export function useReduceMotion(): boolean {
  return useMultiplication((s) => s.save?.settings.reduceMotion ?? false);
}
