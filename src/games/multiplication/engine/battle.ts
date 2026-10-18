import type { GameConfig } from './config';

export type BattleStatus = 'fighting' | 'won' | 'lost';

export interface BattleState {
  distance: number;
  combo: number;
  status: BattleStatus;
  isBoss: boolean;
}

export function startWave(config: Pick<GameConfig, 'battle'>, isBoss = false): BattleState {
  return { distance: config.battle.start, combo: 0, status: 'fighting', isBoss };
}

/**
 * Applies one answer to a final-battle wave.
 * Correct: +hit, or +fastHit when answered within the first half of the time limit.
 * Wrong / timeout: −miss. 100 → wave won, 0 → wave lost.
 */
export function applyBattleAnswer(
  state: BattleState,
  correct: boolean,
  responseMs: number,
  timeLimitMs: number | null,
  config: Pick<GameConfig, 'battle'>,
): BattleState {
  if (state.status !== 'fighting') return state;
  const b = config.battle;
  const mult = state.isBoss ? b.bossPushMultiplier : 1;
  let distance: number;
  let combo: number;
  if (correct) {
    const fast = timeLimitMs !== null && responseMs < timeLimitMs / 2;
    distance = state.distance + (fast ? b.fastHit : b.hit) * mult;
    combo = state.combo + 1;
  } else {
    distance = state.distance - b.miss;
    combo = 0;
  }
  distance = Math.max(0, Math.min(b.max, distance));
  const status: BattleStatus = distance >= b.max ? 'won' : distance <= 0 ? 'lost' : 'fighting';
  return { ...state, distance, combo, status };
}
