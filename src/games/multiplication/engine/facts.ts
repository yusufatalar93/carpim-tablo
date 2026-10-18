import type { GameConfig } from './config';
import type { Fact, FactStats, FactStatsMap } from './types';

/** Builds the canonical id of a fact ("7x8"). Respects treatCommutativeAsSame. */
export function factId(a: number, b: number, config?: Pick<GameConfig, 'treatCommutativeAsSame'>): string {
  if (config?.treatCommutativeAsSame && a > b) return `${b}x${a}`;
  return `${a}x${b}`;
}

export function parseFactId(id: string): Fact | null {
  const m = /^(\d+)x(\d+)$/.exec(id);
  if (!m) return null;
  return { id, a: Number(m[1]), b: Number(m[2]) };
}

/** All facts in the configured range, ordered by a then b. */
export function allFacts(config: GameConfig): Fact[] {
  const out: Fact[] = [];
  for (let a = config.minFactor; a <= config.maxFactor; a++) {
    for (let b = config.minFactor; b <= config.maxFactor; b++) {
      if (config.treatCommutativeAsSame && a > b) continue;
      out.push({ id: factId(a, b), a, b });
    }
  }
  return out;
}

export function emptyStats(fact: Fact): FactStats {
  return { id: fact.id, a: fact.a, b: fact.b, mastery: 0, attempts: 0, correct: 0, wrong: 0, avgResponseMs: 0 };
}

export function createFactStatsMap(config: GameConfig): FactStatsMap {
  const map: FactStatsMap = {};
  for (const f of allFacts(config)) map[f.id] = emptyStats(f);
  return map;
}

/** Whether a fact involves the given multiplication table. */
export function factInTable(fact: Fact, table: number): boolean {
  return fact.a === table || fact.b === table;
}
