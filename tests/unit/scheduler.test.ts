import { describe, expect, it } from 'vitest';
import {
  computeLevelFacts,
  createFactStatsMap,
  createRng,
  effectiveReviewRatio,
  nextMastery,
  QuestionScheduler,
  type FactStatsMap,
} from '../../src/games/multiplication/engine';
import { levels } from '../../src/games/multiplication/levels';
import { cfg } from './helpers';

function answer(facts: FactStatsMap, id: string, correct: boolean, config = cfg()): FactStatsMap {
  return { ...facts, [id]: { ...facts[id], mastery: nextMastery(facts[id].mastery, correct, config) } };
}

describe('bucket rule', () => {
  it('never asks a fact again from a higher level before the others reach it', () => {
    const config = cfg();
    const lf = computeLevelFacts(levels, config).mill;
    for (const seed of [1, 2, 3, 42]) {
      let facts = createFactStatsMap(config);
      const s = new QuestionScheduler(
        { mode: 'bucket', targetFacts: lf.newFacts, targetMastery: 3, reviewPool: [], reviewRatio: 0 },
        config,
        createRng(seed),
      );
      for (let i = 0; i < lf.newFacts.length * 3; i++) {
        const q = s.next(facts);
        const minLevel = Math.min(...lf.newFacts.map((id) => facts[id].mastery));
        expect(facts[q.factId].mastery).toBe(minLevel);
        facts = answer(facts, q.factId, true);
        s.record(q, true);
      }
      expect(lf.newFacts.every((id) => facts[id].mastery === 3)).toBe(true);
    }
  });

  it('does not repeat any of the last 3 facts when the pool is big enough', () => {
    const config = cfg();
    const target = computeLevelFacts(levels, config).home.newFacts;
    let facts = createFactStatsMap(config);
    const s = new QuestionScheduler({ mode: 'bucket', targetFacts: target, targetMastery: 3, reviewPool: [], reviewRatio: 0 }, config, createRng(7));
    const history: string[] = [];
    for (let i = 0; i < 100; i++) {
      const q = s.next(facts);
      expect(history.slice(-3)).not.toContain(q.factId);
      history.push(q.factId);
      facts = answer(facts, q.factId, true);
      s.record(q, true);
    }
  });
});

describe('wrong answers', () => {
  it('reset policy sets mastery to 0, decrement lowers by one', () => {
    expect(nextMastery(2, false, cfg({ wrongAnswerPolicy: 'reset' }))).toBe(0);
    expect(nextMastery(2, false, cfg({ wrongAnswerPolicy: 'decrement' }))).toBe(1);
    expect(nextMastery(0, false, cfg({ wrongAnswerPolicy: 'decrement' }))).toBe(0);
    expect(nextMastery(3, true, cfg())).toBe(3);
    expect(nextMastery(1, true, cfg())).toBe(2);
  });

  it('asks a wrongly answered fact again 2–4 questions later', () => {
    const config = cfg();
    const target = computeLevelFacts(levels, config).home.newFacts;
    for (let seed = 1; seed <= 30; seed++) {
      let facts = createFactStatsMap(config);
      const s = new QuestionScheduler({ mode: 'bucket', targetFacts: target, targetMastery: 2, reviewPool: [], reviewRatio: 0 }, config, createRng(seed));
      // warm up a little, then answer one wrong
      for (let i = 0; i < 5; i++) {
        const q = s.next(facts);
        facts = answer(facts, q.factId, true);
        s.record(q, true);
      }
      const wrong = s.next(facts);
      facts = answer(facts, wrong.factId, false);
      s.record(wrong, false);
      const after: string[] = [];
      for (let i = 0; i < 5; i++) {
        const q = s.next(facts);
        after.push(q.factId);
        facts = answer(facts, q.factId, true);
        s.record(q, true);
      }
      const pos = after.indexOf(wrong.factId);
      expect(pos).toBeGreaterThanOrEqual(2); // at least 2 other questions in between
      expect(pos).toBeLessThanOrEqual(4);
    }
  });
});

describe('review ratio', () => {
  it('uses the base ratio when there are enough new facts', () => {
    expect(effectiveReviewRatio(30, 50, cfg())).toBe(0.25);
  });

  it('raises the ratio so a short level lasts minQuestionsPerLevel', () => {
    // 7 new facts × 2 = 14 steps → 14 / (1 - r) = 20 → r = 0.3
    expect(effectiveReviewRatio(14, 80, cfg())).toBeCloseTo(0.3);
  });

  it('is 0 without a review pool and capped by maxReviewRatio', () => {
    expect(effectiveReviewRatio(10, 0, cfg())).toBe(0);
    expect(effectiveReviewRatio(1, 50, cfg())).toBe(cfg().maxReviewRatio);
  });

  it('mixes in about the configured share of review questions', () => {
    const config = cfg();
    const lf = computeLevelFacts(levels, config).orchard;
    let facts = createFactStatsMap(config);
    const s = new QuestionScheduler(
      { mode: 'bucket', targetFacts: lf.newFacts, targetMastery: 3, reviewPool: lf.reviewPool, reviewRatio: 0.25 },
      config,
      createRng(3),
    );
    let review = 0;
    for (let i = 0; i < 40; i++) {
      const q = s.next(facts);
      if (q.isReview) {
        review++;
        expect(lf.reviewPool).toContain(q.factId);
      } else expect(lf.newFacts).toContain(q.factId);
      facts = answer(facts, q.factId, true);
      s.record(q, true);
    }
    expect(review).toBe(10);
  });
});
