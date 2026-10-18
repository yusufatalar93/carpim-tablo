import { describe, expect, it } from 'vitest';
import {
  applyBattleAnswer,
  completeLevel,
  computeLevelFacts,
  computeStars,
  createAdventure,
  createFactStatsMap,
  createFinalSession,
  createLevelSession,
  createPracticeSession,
  createRng,
  isPlayable,
  startWave,
  type FactStatsMap,
} from '../../src/games/multiplication/engine';
import { levels } from '../../src/games/multiplication/levels';
import { cfg } from './helpers';

const config = cfg();
const lf = computeLevelFacts(levels, config);

describe('level session', () => {
  it('passes when every new fact reaches the pass mastery and reports ≥ 20 questions', () => {
    const s = createLevelSession(lf.waterfall, createFactStatsMap(config), config, createRng(1), 5000);
    let guard = 0;
    let passed = false;
    while (!passed && guard++ < 500) {
      const q = s.nextQuestion();
      passed = s.answer(q.answer, 1000, 0).levelPassed;
    }
    expect(passed).toBe(true);
    expect(s.isComplete).toBe(true);
    expect(lf.waterfall.newFacts.every((id) => s.facts[id].mastery >= 2)).toBe(true);
    expect(s.summary().answered).toBeGreaterThanOrEqual(config.minQuestionsPerLevel);
  });

  it('wrong review answers do not block passing but lower that fact’s mastery', () => {
    const facts = createFactStatsMap(config);
    for (const id of lf.forest.reviewPool) facts[id] = { ...facts[id], mastery: 2 };
    const s = createLevelSession(lf.forest, facts, config, createRng(5), 5000);
    let passed = false;
    const missedReviews = new Set<string>();
    let guard = 0;
    while (!passed && guard++ < 500) {
      const q = s.nextQuestion();
      const isReviewMiss = q.isReview && !q.isRetry;
      if (isReviewMiss) missedReviews.add(q.factId);
      passed = s.answer(isReviewMiss ? q.answer + 1 : q.answer, 1000, 0).levelPassed;
    }
    expect(passed).toBe(true);
    expect(missedReviews.size).toBeGreaterThan(0);
    for (const id of missedReviews) expect(s.facts[id].mastery).toBeLessThan(2);
  });

  it('timeouts count as wrong and reset mastery', () => {
    const s = createLevelSession(lf.home, createFactStatsMap(config), config, createRng(2), 5000);
    const q = s.nextQuestion();
    s.answer(q.answer, 1000, 0);
    // answer the same fact later with a timeout via a fresh session resuming the facts
    const s2 = createLevelSession(lf.home, s.facts, config, createRng(2), 5000);
    let guard = 0;
    let found = false;
    while (!found && guard++ < 100) {
      const q2 = s2.nextQuestion();
      if (q2.factId === q.factId) {
        const r = s2.answer(null, 5000, 0);
        expect(r.correct).toBe(false);
        expect(r.timedOut).toBe(true);
        expect(s2.facts[q.factId].mastery).toBe(0);
        expect(s2.facts[q.factId].wrong).toBe(1);
        found = true;
      } else s2.answer(q2.answer, 1000, 0);
    }
    expect(found).toBe(true);
  });

  it('resumes where it left off (mastery persists across sessions)', () => {
    const facts = createFactStatsMap(config);
    for (const id of lf.mill.newFacts) facts[id] = { ...facts[id], mastery: 2 };
    facts[lf.mill.newFacts[0]] = { ...facts[lf.mill.newFacts[0]], mastery: 1 };
    const s = createLevelSession(lf.mill, facts, config, createRng(1), null);
    expect(s.progress()).toEqual({ done: 14, total: 15 });
  });
});

describe('adventure progress', () => {
  it('does not unlock the next level until the current one is passed', () => {
    let adv = createAdventure(levels);
    expect(isPlayable(adv, 'home')).toBe(true);
    expect(isPlayable(adv, 'mill')).toBe(false);
    const r = completeLevel(adv, levels, 'home', 2, 0.8, 1);
    adv = r.adventure;
    expect(r.unlockedLevelId).toBe('mill');
    expect(isPlayable(adv, 'mill')).toBe(true);
    expect(isPlayable(adv, 'bridge')).toBe(false);
    expect(adv.currentLevelId).toBe('mill');
  });

  it('cannot complete a locked level and keeps best stars on replay', () => {
    let adv = createAdventure(levels);
    expect(completeLevel(adv, levels, 'bridge', 3, 1, 1).adventure).toBe(adv);
    adv = completeLevel(adv, levels, 'home', 3, 0.95, 1).adventure;
    const replay = completeLevel(adv, levels, 'home', 1, 0.5, 2);
    expect(replay.adventure.levels.home.bestStars).toBe(3);
    expect(replay.unlockedLevelId).toBeNull();
  });
});

describe('stars', () => {
  it('follows the thresholds', () => {
    expect(computeStars(0.95, 2500, config)).toBe(3);
    expect(computeStars(0.95, 3500, config)).toBe(2);
    expect(computeStars(0.9, 2999, config)).toBe(3);
    expect(computeStars(0.75, 1000, config)).toBe(2);
    expect(computeStars(0.74, 1000, config)).toBe(1);
  });
});

describe('battle', () => {
  it('applies hits, fast hits and misses', () => {
    let b = startWave(config);
    expect(b.distance).toBe(50);
    b = applyBattleAnswer(b, true, 4000, 5000, config);
    expect(b.distance).toBe(58);
    b = applyBattleAnswer(b, true, 1000, 5000, config);
    expect(b.distance).toBe(70);
    expect(b.combo).toBe(2);
    b = applyBattleAnswer(b, false, 5000, 5000, config);
    expect(b.distance).toBe(58);
    expect(b.combo).toBe(0);
  });

  it('wins at 100 and loses at 0', () => {
    let b = startWave(config);
    while (b.status === 'fighting') b = applyBattleAnswer(b, true, 100, 5000, config);
    expect(b.status).toBe('won');
    expect(b.distance).toBe(100);
    let c = startWave(config);
    while (c.status === 'fighting') c = applyBattleAnswer(c, false, 5000, 5000, config);
    expect(c.status).toBe('lost');
    expect(c.distance).toBe(0);
    expect(applyBattleAnswer(c, true, 100, 5000, config)).toBe(c);
  });

  it('the boss is tougher', () => {
    const b = applyBattleAnswer(startWave(config, true), true, 100, 5000, config);
    expect(b.distance).toBe(56);
  });
});

describe('final session', () => {
  const mastered = (level: number): FactStatsMap => {
    const f = createFactStatsMap(config);
    for (const id of Object.keys(f)) f[id] = { ...f[id], mastery: level as 2 };
    return f;
  };

  it('finishes when all facts reach mastery 3 (100 correct answers from mastery 2)', () => {
    const s = createFinalSession(mastered(2), config, createRng(9), 5000);
    let n = 0;
    let done = false;
    while (!done && n < 300) {
      const q = s.nextQuestion();
      const r = s.answer(q.answer, 1000, 0);
      n++;
      done = r.finalComplete;
      if (r.battle?.status === 'won') s.nextWave();
    }
    expect(done).toBe(true);
    expect(n).toBe(100);
  });

  it('a lost wave keeps mastery progress', () => {
    const s = createFinalSession(mastered(2), config, createRng(4), 5000);
    let correctIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const q = s.nextQuestion();
      s.answer(q.answer, 4000, 0);
      correctIds.push(q.factId);
    }
    let battle = s.battle!;
    while (battle.status === 'fighting') {
      const q = s.nextQuestion();
      battle = s.answer(-1, 5000, 0).battle!;
      correctIds = correctIds.filter((id) => id !== q.factId);
    }
    expect(battle.status).toBe('lost');
    const before = correctIds.map((id) => s.facts[id].mastery);
    const fresh = s.nextWave();
    expect(fresh.distance).toBe(50);
    expect(correctIds.map((id) => s.facts[id].mastery)).toEqual(before);
    expect(before.every((m) => m === 3)).toBe(true);
  });

  it('spawns the boss when few answers remain', () => {
    const f = mastered(3);
    f['7x8'] = { ...f['7x8'], mastery: 2 };
    expect(createFinalSession(f, config, createRng(1), 5000).battle!.isBoss).toBe(true);
    expect(createFinalSession(mastered(2), config, createRng(1), 5000).battle!.isBoss).toBe(false);
  });
});

describe('practice', () => {
  it('weighted selection asks hard facts more often (seeded)', () => {
    const facts = createFactStatsMap(config);
    for (const id of Object.keys(facts)) facts[id] = { ...facts[id], attempts: 5, correct: 5, mastery: 3, avgResponseMs: 1500 };
    facts['7x8'] = { ...facts['7x8'], attempts: 10, correct: 3, wrong: 7, mastery: 0, avgResponseMs: 4500 };
    facts['6x7'] = { ...facts['6x7'], attempts: 10, correct: 4, wrong: 6, mastery: 1, avgResponseMs: 4000 };
    const s = createPracticeSession({ kind: 'weak' }, 2000, facts, config, createRng(11), null);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 2000; i++) {
      const q = s.nextQuestion();
      counts[q.factId] = (counts[q.factId] ?? 0) + 1;
      s.answer(q.answer, 1000, 0);
    }
    const avgOthers = (2000 - counts['7x8'] - counts['6x7']) / 98;
    expect(counts['7x8']).toBeGreaterThan(avgOthers * 2);
    expect(counts['6x7']).toBeGreaterThan(avgOthers * 2);
  });

  it('updates stats but not mastery, and ends after the round length', () => {
    const facts = createFactStatsMap(config);
    const s = createPracticeSession({ kind: 'tables', tables: [7] }, 10, facts, config, createRng(1), null);
    let r;
    for (let i = 0; i < 10; i++) {
      const q = s.nextQuestion();
      expect(q.a === 7 || q.b === 7).toBe(true);
      r = s.answer(q.answer, 1000, 0);
    }
    expect(r!.roundComplete).toBe(true);
    const touched = Object.values(s.facts).filter((f) => f.attempts > 0);
    expect(touched.length).toBeGreaterThan(0);
    expect(touched.every((f) => f.mastery === 0)).toBe(true);
  });

  it('limits a "facts" round to the given facts', () => {
    const s = createPracticeSession({ kind: 'facts', factIds: ['7x8', '8x7', '6x9'] }, 10, createFactStatsMap(config), config, createRng(1), null);
    for (let i = 0; i < 10; i++) {
      const q = s.nextQuestion();
      expect(['7x8', '8x7', '6x9']).toContain(q.factId);
      s.answer(q.answer, 1000, 0);
    }
  });
});

describe('replay', () => {
  it('replaying a completed level asks its facts again and still passes', () => {
    const facts = createFactStatsMap(config);
    for (const id of lf.mill.newFacts) facts[id] = { ...facts[id], mastery: 3 };
    const s = createLevelSession(lf.mill, facts, config, createRng(1), 5000, { replay: true });
    expect(s.isReplay).toBe(true);
    expect(s.progress()).toEqual({ done: 0, total: 15 });
    let passed = false;
    let n = 0;
    while (!passed && n++ < 200) {
      const q = s.nextQuestion();
      passed = s.answer(q.answer, 1000, 0).levelPassed;
    }
    expect(passed).toBe(true);
    expect(s.summary().answered).toBeGreaterThanOrEqual(30);
    expect(lf.mill.newFacts.every((id) => s.facts[id].mastery === 3)).toBe(true);
  });
});

describe('minimum level length', () => {
  it('every normal level lasts at least minQuestionsPerLevel questions on a perfect run', () => {
    for (const level of levels.filter((l) => !l.isFinal)) {
      const facts = createFactStatsMap(config);
      const s = createLevelSession(lf[level.id], facts, config, createRng(3), 5000);
      let passed = false;
      let n = 0;
      while (!passed && n++ < 500) {
        const q = s.nextQuestion();
        passed = s.answer(q.answer, 1000, 0).levelPassed;
      }
      expect(passed).toBe(true);
      expect(s.summary().answered, level.id).toBeGreaterThanOrEqual(config.minQuestionsPerLevel);
    }
  });
});
