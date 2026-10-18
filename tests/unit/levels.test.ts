import { describe, expect, it } from 'vitest';
import { allFacts, computeLevelFacts, levelOfFact } from '../../src/games/multiplication/engine';
import { levels } from '../../src/games/multiplication/levels';
import { cfg } from './helpers';

describe('facts', () => {
  it('has 100 facts by default and keeps 7x8 / 8x7 separate', () => {
    const facts = allFacts(cfg());
    expect(facts).toHaveLength(100);
    expect(facts.map((f) => f.id)).toContain('7x8');
    expect(facts.map((f) => f.id)).toContain('8x7');
  });

  it('merges commutative facts when configured', () => {
    expect(allFacts(cfg({ treatCommutativeAsSame: true }))).toHaveLength(55);
  });
});

describe('computeLevelFacts', () => {
  const config = cfg();
  const lf = computeLevelFacts(levels, config);
  const normal = levels.filter((l) => !l.isFinal);

  it('matches the expected new-fact counts per level', () => {
    expect(normal.map((l) => lf[l.id].newFacts.length)).toEqual([36, 15, 13, 11, 9, 7, 9]);
  });

  it('assigns every fact to exactly one normal level and covers all 100', () => {
    const counts = new Map<string, number>();
    for (const l of normal) for (const id of lf[l.id].newFacts) counts.set(id, (counts.get(id) ?? 0) + 1);
    expect(counts.size).toBe(100);
    expect([...counts.values()].every((c) => c === 1)).toBe(true);
  });

  it('includes both orders of a fact', () => {
    expect(lf.orchard.newFacts).toContain('3x7');
    expect(lf.orchard.newFacts).toContain('7x3');
  });

  it('does not count a fact from an earlier level as new later', () => {
    expect(lf.bridge.newFacts).not.toContain('2x5'); // already in "mill" (2s)
    expect(lf.bridge.reviewPool).toContain('2x5');
    expect(lf.home.reviewPool).toEqual([]);
  });

  it('final contains all facts', () => {
    expect(lf.final.newFacts).toHaveLength(100);
  });

  it('reports the level of a fact', () => {
    expect(levelOfFact(lf, levels, '7x8')).toBe('pass');
    expect(levelOfFact(lf, levels, '1x7')).toBe('home');
  });

  it('follows a reordered level list automatically', () => {
    const reordered = [levels[1], levels[0], ...levels.slice(2)];
    const r = computeLevelFacts(reordered, config);
    expect(r.mill.newFacts).toHaveLength(19); // 2..? 2s with 1..10 = 19 facts
    expect(r.home.newFacts).toHaveLength(32);
  });
});
