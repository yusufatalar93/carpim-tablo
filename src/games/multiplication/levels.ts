import type { LevelDef } from './engine/types';

/**
 * Adventure levels, from easy to hard. New facts per level are computed automatically
 * (see engine/levels.ts) — reorder or add entries freely. Keep ids stable: they are saved.
 */
export const levels: LevelDef[] = [
  { id: 'home', nameKey: 'home', tables: [1, 10], scene: 'home' },
  { id: 'mill', nameKey: 'mill', tables: [2], scene: 'mill' },
  { id: 'bridge', nameKey: 'bridge', tables: [5], scene: 'bridge' },
  { id: 'orchard', nameKey: 'orchard', tables: [3], scene: 'orchard' },
  { id: 'forest', nameKey: 'forest', tables: [4], scene: 'forest' },
  { id: 'waterfall', nameKey: 'waterfall', tables: [9], scene: 'waterfall' },
  { id: 'pass', nameKey: 'pass', tables: [6, 7, 8], scene: 'pass' },
  { id: 'final', nameKey: 'final', tables: [], scene: 'school', isFinal: true },
];
