import { describe, expect, it } from 'vitest';
import {
  completeLevel,
  createSave,
  loadSaveData,
  migrateSave,
  recordStats,
  reconcileAdventure,
  type LevelDef,
} from '../../src/games/multiplication/engine';
import { levels } from '../../src/games/multiplication/levels';
import { MemoryStorageAdapter } from '../../src/platform/storage';
import { cfg } from './helpers';

const config = cfg();

describe('save / load', () => {
  it('round-trips through a storage adapter', async () => {
    const storage = new MemoryStorageAdapter();
    const save = createSave('p1', levels, config);
    save.facts['7x8'] = { ...recordStats(save.facts['7x8'], true, 2000, 5), mastery: 2 };
    save.adventure = completeLevel(save.adventure, levels, 'home', 3, 1, 5).adventure;
    save.settings.soundOn = false;
    await storage.set('k', save);
    const loaded = loadSaveData(await storage.get('k'), 'p1', levels, config);
    expect(loaded).toEqual(save);
  });

  it('falls back to defaults for corrupt data', () => {
    for (const raw of [null, 'garbage', 42, [], { schemaVersion: 99 }, { schemaVersion: 1, facts: 'x', adventure: 5, settings: null }]) {
      const s = loadSaveData(raw, 'p1', levels, config);
      expect(Object.keys(s.facts)).toHaveLength(100);
      expect(s.adventure.levels.home.status).toBe('unlocked');
      expect(s.settings.difficulty).toBe('normal');
    }
  });

  it('repairs invalid field values', () => {
    const s = loadSaveData(
      { schemaVersion: 1, facts: { '7x8': { mastery: 9, attempts: -3, correct: 2, wrong: 1 } }, settings: { difficulty: 'insane' } },
      'p1',
      levels,
      config,
    );
    expect(s.facts['7x8'].mastery).toBe(0);
    expect(s.facts['7x8'].attempts).toBe(3);
    expect(s.settings.difficulty).toBe('normal');
  });

  it('runs migrations in order', () => {
    const migrations = {
      0: (d: Record<string, unknown>) => ({ ...d, schemaVersion: 1, renamed: d.old }),
    };
    expect(migrateSave({ old: 'x' }, migrations, 1)).toEqual({ old: 'x', schemaVersion: 1, renamed: 'x' });
    expect(migrateSave({ schemaVersion: 2 }, migrations, 1)).toBeNull();
    expect(migrateSave({ old: 1 }, {}, 1)).toBeNull();
    expect(migrateSave({ old: 1 }, { 0: () => { throw new Error('boom'); } }, 1)).toBeNull();
  });
});

describe('level list changes', () => {
  it('ignores unknown level ids and adds new levels in the right lock state', () => {
    let save = createSave('p1', levels, config);
    save.adventure = completeLevel(save.adventure, levels, 'home', 2, 0.8, 1).adventure;
    save.adventure = completeLevel(save.adventure, levels, 'mill', 3, 0.9, 2).adventure;
    const raw = JSON.parse(JSON.stringify(save));
    raw.adventure.levels.removed = { levelId: 'removed', status: 'completed', bestStars: 3 };

    const extra: LevelDef = { id: 'meadow', nameKey: 'meadow', tables: [11], scene: 'forest' };
    const newList = [levels[0], levels[1], extra, ...levels.slice(2)];
    const loaded = loadSaveData(raw, 'p1', newList, config);
    expect(loaded.adventure.levels.removed).toBeUndefined();
    expect(loaded.adventure.levels.home.status).toBe('completed');
    expect(loaded.adventure.levels.mill.bestStars).toBe(3);
    expect(loaded.adventure.levels.meadow.status).toBe('unlocked');
    expect(loaded.adventure.levels.bridge.status).toBe('locked');
    expect(loaded.adventure.currentLevelId).toBe('meadow');
  });

  it('a level inserted before completed ones keeps earned progress', () => {
    const adv = createSave('p1', levels, config).adventure;
    const done = completeLevel(adv, levels, 'home', 2, 0.8, 1).adventure;
    const extra: LevelDef = { id: 'intro', nameKey: 'intro', tables: [0], scene: 'home' };
    const r = reconcileAdventure(done, [extra, ...levels]);
    expect(r.levels.intro.status).toBe('unlocked');
    expect(r.levels.home.status).toBe('completed');
    expect(r.levels.mill.status).toBe('unlocked');
    expect(r.levels.bridge.status).toBe('locked');
    expect(r.currentLevelId).toBe('mill'); // saved position is still valid
  });

  it('removes a stale currentLevelId', () => {
    const r = reconcileAdventure({ currentLevelId: 'nope', levels: {} }, levels);
    expect(r.currentLevelId).toBe('home');
  });
});
