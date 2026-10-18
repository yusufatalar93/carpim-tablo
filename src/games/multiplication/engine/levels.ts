import type { GameConfig } from './config';
import { allFacts, factInTable } from './facts';
import type { LevelDef } from './types';

export interface LevelFacts {
  /** Facts first introduced in this level. For the final: every fact. */
  newFacts: string[];
  /** Facts introduced in earlier levels (review pool). */
  reviewPool: string[];
}

/**
 * Computes new / review facts for every level from the level list.
 * A fact belongs to the first normal level whose tables contain one of its factors.
 * Facts not covered by any normal level only appear in the final.
 */
export function computeLevelFacts(levels: readonly LevelDef[], config: GameConfig): Record<string, LevelFacts> {
  const facts = allFacts(config);
  const assigned = new Set<string>();
  const result: Record<string, LevelFacts> = {};
  const seen: string[] = [];
  for (const level of levels) {
    if (level.isFinal) {
      result[level.id] = { newFacts: facts.map((f) => f.id), reviewPool: [] };
      continue;
    }
    const newFacts = facts
      .filter((f) => !assigned.has(f.id) && level.tables.some((t) => factInTable(f, t)))
      .map((f) => f.id);
    result[level.id] = { newFacts, reviewPool: [...seen] };
    for (const id of newFacts) {
      assigned.add(id);
      seen.push(id);
    }
  }
  return result;
}

/** Id of the level a fact is first introduced in (normal levels only). */
export function levelOfFact(levelFacts: Record<string, LevelFacts>, levels: readonly LevelDef[], id: string): string | undefined {
  return levels.find((l) => !l.isFinal && levelFacts[l.id]?.newFacts.includes(id))?.id;
}
