import { config } from './config';
import { computeLevelFacts, type LevelDef } from './engine';
import { levels } from './levels';

/** Derived, static game data computed once from the level list and config. */
export const levelFacts = computeLevelFacts(levels, config);

export function getLevel(id: string): LevelDef | undefined {
  return levels.find((l) => l.id === id);
}

export function levelIndex(id: string): number {
  return levels.findIndex((l) => l.id === id);
}

export const finalLevel = levels.find((l) => l.isFinal)!;
export const normalLevels = levels.filter((l) => !l.isFinal);
