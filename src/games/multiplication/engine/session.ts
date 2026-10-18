import { applyBattleAnswer, startWave, type BattleState } from './battle';
import type { GameConfig } from './config';
import { allFacts, factInTable, parseFactId } from './facts';
import type { LevelFacts } from './levels';
import { allReached, countReached, nextMastery, remainingSteps } from './mastery';
import type { Rng } from './rng';
import { effectiveReviewRatio, QuestionScheduler, type ScheduledQuestion } from './scheduler';
import { computeStars } from './stars';
import { recordStats } from './stats';
import type { FactStatsMap, Mastery } from './types';

export type SessionMode = 'level' | 'final' | 'practice';

export interface Question extends ScheduledQuestion {
  a: number;
  b: number;
  answer: number;
}

export interface AnswerResult {
  question: Question;
  correct: boolean;
  timedOut: boolean;
  masteryBefore: number;
  masteryAfter: number;
  combo: number;
  /** Normal level: all new facts reached the pass mastery with this answer. */
  levelPassed: boolean;
  /** Final: every fact reached the final mastery with this answer. */
  finalComplete: boolean;
  /** Practice: round length reached. */
  roundComplete: boolean;
  battle?: BattleState;
}

export interface SessionSummary {
  answered: number;
  correct: number;
  accuracy: number;
  avgCorrectMs: number;
  bestCombo: number;
  stars: 1 | 2 | 3;
}

interface SessionSetup {
  mode: SessionMode;
  targetFacts: string[];
  reviewPool: string[];
  targetMastery: number;
  schedulerMode: 'bucket' | 'weighted';
  reviewRatio: number;
  questionLimit: number | null;
  timeLimitMs: number | null;
  /**
   * Replay of a finished level/final: progress is tracked in a session-local mastery map that
   * starts at 0, while global mastery and statistics are still updated as usual.
   */
  trackLocally?: boolean;
}

/**
 * One play session (a level attempt, the final, or a practice round).
 * Owns a working copy of the fact statistics; callers persist `facts` after each answer.
 */
export class GameSession {
  readonly mode: SessionMode;
  readonly timeLimitMs: number | null;
  readonly targetFacts: readonly string[];
  readonly targetMastery: number;
  private _facts: FactStatsMap;
  private scheduler: QuestionScheduler;
  private current: Question | null = null;
  private answered = 0;
  private correctCount = 0;
  private correctMs = 0;
  private combo = 0;
  private bestCombo = 0;
  private questionLimit: number | null;
  private _battle: BattleState | null = null;
  private done = false;
  private local: Record<string, Mastery> | null = null;

  constructor(
    setup: SessionSetup,
    facts: FactStatsMap,
    private readonly config: GameConfig,
    rng: Rng,
  ) {
    this.mode = setup.mode;
    this.timeLimitMs = setup.timeLimitMs;
    this.targetFacts = setup.targetFacts;
    this.targetMastery = setup.targetMastery;
    this.questionLimit = setup.questionLimit;
    this._facts = { ...facts };
    if (setup.trackLocally) this.local = Object.fromEntries(setup.targetFacts.map((id) => [id, 0 as Mastery]));
    this.scheduler = new QuestionScheduler(
      {
        mode: setup.schedulerMode,
        targetFacts: setup.targetFacts,
        targetMastery: setup.targetMastery,
        reviewPool: setup.reviewPool,
        reviewRatio: setup.reviewRatio,
      },
      config,
      rng,
    );
    if (this.mode === 'final') this._battle = startWave(config, this.shouldBeBoss());
  }

  get facts(): FactStatsMap {
    return this._facts;
  }

  /** Mastery view used for scheduling and completion (global, or session-local on replay). */
  private view(): FactStatsMap {
    if (!this.local) return this._facts;
    const v: FactStatsMap = { ...this._facts };
    for (const [id, m] of Object.entries(this.local)) v[id] = { ...v[id], mastery: m };
    return v;
  }

  get isReplay(): boolean {
    return this.local !== null;
  }

  get battle(): BattleState | null {
    return this._battle;
  }

  get isComplete(): boolean {
    return this.done;
  }

  get currentCombo(): number {
    return this.combo;
  }

  /** Progress towards the session goal, e.g. { done: 9, total: 15 }. */
  progress(): { done: number; total: number } {
    if (this.mode === 'practice') return { done: this.answered, total: this.questionLimit ?? 0 };
    return { done: countReached(this.targetFacts, this.view(), this.targetMastery), total: this.targetFacts.length };
  }

  /** Fraction (0..1) of the remaining work done; used for the kid's position in the level scene. */
  stepProgress(): number {
    const total = this.targetFacts.length * this.targetMastery;
    return total === 0 ? 1 : 1 - remainingSteps(this.targetFacts, this.view(), this.targetMastery) / total;
  }

  nextQuestion(): Question {
    if (this.current) return this.current;
    const q = this.scheduler.next(this.view());
    const parsed = parseFactId(q.factId)!;
    this.current = { ...q, a: parsed.a, b: parsed.b, answer: parsed.a * parsed.b };
    return this.current;
  }

  /**
   * Submits an answer for the current question. `value === null` means the time ran out.
   * Updates statistics, mastery (not in practice), battle state and completion.
   */
  answer(value: number | null, responseMs: number, now: number): AnswerResult {
    const question = this.nextQuestion();
    this.current = null;
    const timedOut = value === null;
    const correct = !timedOut && value === question.answer;
    const before = this._facts[question.factId];
    let after = recordStats(before, correct, responseMs, now);
    if (this.mode !== 'practice') after = { ...after, mastery: nextMastery(before.mastery, correct, this.config) };
    this._facts = { ...this._facts, [question.factId]: after };
    if (this.local && question.factId in this.local) {
      this.local[question.factId] = nextMastery(this.local[question.factId], correct, this.config);
    }
    this.scheduler.record(question, correct);

    this.answered++;
    if (correct) {
      this.correctCount++;
      this.correctMs += responseMs;
      this.combo++;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
    } else {
      this.combo = 0;
    }

    let levelPassed = false;
    let finalComplete = false;
    let roundComplete = false;
    if (this.mode === 'level') levelPassed = allReached(this.targetFacts, this.view(), this.targetMastery);
    if (this.mode === 'final') {
      finalComplete = allReached(this.targetFacts, this.view(), this.targetMastery);
      if (this._battle) this._battle = applyBattleAnswer(this._battle, correct, responseMs, this.timeLimitMs, this.config);
    }
    if (this.mode === 'practice') roundComplete = this.questionLimit !== null && this.answered >= this.questionLimit;
    this.done = levelPassed || finalComplete || roundComplete;

    return {
      question,
      correct,
      timedOut,
      masteryBefore: before.mastery,
      masteryAfter: after.mastery,
      combo: this.combo,
      levelPassed,
      finalComplete,
      roundComplete,
      ...(this._battle ? { battle: this._battle } : {}),
    };
  }

  /** Final only: starts the next wave (after a win) or retries the current one (after a loss). Mastery is kept. */
  nextWave(): BattleState {
    this._battle = startWave(this.config, this.shouldBeBoss());
    this.combo = 0;
    return this._battle;
  }

  summary(): SessionSummary {
    const accuracy = this.answered ? this.correctCount / this.answered : 0;
    const avgCorrectMs = this.correctCount ? Math.round(this.correctMs / this.correctCount) : 0;
    return {
      answered: this.answered,
      correct: this.correctCount,
      accuracy,
      avgCorrectMs,
      bestCombo: this.bestCombo,
      stars: computeStars(accuracy, avgCorrectMs, this.config),
    };
  }

  private shouldBeBoss(): boolean {
    return remainingSteps(this.targetFacts, this.view(), this.targetMastery) <= this.config.battle.bossThreshold;
  }
}

export interface SessionOptions {
  /** Replay a completed level/final for more stars (see SessionSetup.trackLocally). */
  replay?: boolean;
}

/** Starts (or resumes) a normal adventure level. */
export function createLevelSession(
  levelFacts: LevelFacts,
  facts: FactStatsMap,
  config: GameConfig,
  rng: Rng,
  timeLimitMs: number | null,
  options: SessionOptions = {},
): GameSession {
  const steps = options.replay
    ? levelFacts.newFacts.length * config.levelPassMastery
    : remainingSteps(levelFacts.newFacts, facts, config.levelPassMastery);
  return new GameSession(
    {
      mode: 'level',
      targetFacts: levelFacts.newFacts,
      reviewPool: levelFacts.reviewPool,
      targetMastery: config.levelPassMastery,
      schedulerMode: 'bucket',
      reviewRatio: effectiveReviewRatio(steps, levelFacts.reviewPool.length, config),
      questionLimit: null,
      timeLimitMs,
      trackLocally: options.replay,
    },
    facts,
    config,
    rng,
  );
}

/**
 * Starts (or resumes) the final battle: every fact must reach finalMastery.
 * A replay asks every fact once (session-local), keeping it a reasonable length.
 */
export function createFinalSession(
  facts: FactStatsMap,
  config: GameConfig,
  rng: Rng,
  timeLimitMs: number | null,
  options: SessionOptions = {},
): GameSession {
  return new GameSession(
    {
      mode: 'final',
      targetFacts: allFacts(config).map((f) => f.id),
      reviewPool: [],
      targetMastery: options.replay ? 1 : config.finalMastery,
      trackLocally: options.replay,
      schedulerMode: 'bucket',
      reviewRatio: 0,
      questionLimit: null,
      timeLimitMs,
    },
    facts,
    config,
    rng,
  );
}

export type PracticeSource = { kind: 'weak' } | { kind: 'tables'; tables: number[] } | { kind: 'facts'; factIds: string[] };

/** Minimum number of seen facts before "weak" practice ignores unseen facts. */
export const PRACTICE_MIN_SEEN = 8;

/** Fact pool for a practice round. */
export function practicePool(source: PracticeSource, facts: FactStatsMap, config: GameConfig): string[] {
  const all = allFacts(config);
  if (source.kind === 'tables') return all.filter((f) => source.tables.some((t) => factInTable(f, t))).map((f) => f.id);
  if (source.kind === 'facts') return source.factIds.filter((id) => facts[id]);
  const seen = all.filter((f) => (facts[f.id]?.attempts ?? 0) > 0).map((f) => f.id);
  return seen.length >= PRACTICE_MIN_SEEN ? seen : all.map((f) => f.id);
}

/** Starts a practice round. Updates statistics only — never mastery or adventure progress. */
export function createPracticeSession(
  source: PracticeSource,
  length: number,
  facts: FactStatsMap,
  config: GameConfig,
  rng: Rng,
  timeLimitMs: number | null,
): GameSession {
  return new GameSession(
    {
      mode: 'practice',
      targetFacts: practicePool(source, facts, config),
      reviewPool: [],
      targetMastery: config.maxMastery,
      schedulerMode: 'weighted',
      reviewRatio: 0,
      questionLimit: length,
      timeLimitMs,
    },
    facts,
    config,
    rng,
  );
}
