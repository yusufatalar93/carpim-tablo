import type { GameConfig } from './config';
import type { Rng } from './rng';
import { weaknessWeight } from './stats';
import type { FactStatsMap } from './types';

export interface SchedulerOptions {
  /**
   * 'bucket': lowest-mastery-first among target facts that have not reached targetMastery.
   * 'weighted': weakness-weighted random among target facts (practice mode).
   */
  mode: 'bucket' | 'weighted';
  targetFacts: readonly string[];
  targetMastery: number;
  /** Earlier facts mixed in by weakness weight (adventure review). */
  reviewPool: readonly string[];
  /** Effective share of review questions (0..1). */
  reviewRatio: number;
}

export interface ScheduledQuestion {
  factId: string;
  isReview: boolean;
  isRetry: boolean;
}

interface RetryItem {
  factId: string;
  wait: number;
}

/**
 * Raises the review ratio for levels with few new facts so the level lasts at least
 * `minQuestionsPerLevel` questions. `remainingNewSteps` = correct answers still needed.
 */
export function effectiveReviewRatio(
  remainingNewSteps: number,
  reviewPoolSize: number,
  config: Pick<GameConfig, 'reviewRatio' | 'maxReviewRatio' | 'minQuestionsPerLevel'>,
): number {
  if (reviewPoolSize === 0) return 0;
  let r = config.reviewRatio;
  if (remainingNewSteps > 0 && remainingNewSteps / (1 - r) < config.minQuestionsPerLevel) {
    r = 1 - remainingNewSteps / config.minQuestionsPerLevel;
  }
  return Math.min(config.maxReviewRatio, Math.max(config.reviewRatio, r));
}

/**
 * Picks the next question. Stateful (recent list, retry queue, counters) but pure:
 * no I/O, randomness only through the injected Rng.
 */
export class QuestionScheduler {
  private recent: string[] = [];
  private retryQueue: RetryItem[] = [];
  private asked = 0;
  private reviewAsked = 0;

  constructor(
    private readonly opts: SchedulerOptions,
    private readonly config: GameConfig,
    private readonly rng: Rng,
  ) {}

  /** Number of questions asked so far. */
  get askedCount(): number {
    return this.asked;
  }

  get reviewCount(): number {
    return this.reviewAsked;
  }

  next(facts: FactStatsMap): ScheduledQuestion {
    const due = this.retryQueue.find((r) => r.wait <= 0);
    if (due) {
      return { factId: due.factId, isReview: this.opts.reviewPool.includes(due.factId), isRetry: true };
    }

    const wantReview =
      this.opts.reviewPool.length > 0 && this.reviewAsked < Math.round((this.asked + 1) * this.opts.reviewRatio);
    const main = this.pickMain(facts);
    if (wantReview || main === null) {
      const review = this.pickWeighted(this.opts.reviewPool, facts);
      if (review !== null) return { factId: review, isReview: true, isRetry: false };
    }
    if (main !== null) return { factId: main, isReview: false, isRetry: false };
    // Everything is at target and there is no review pool: ask the weakest target fact.
    return { factId: this.pickWeighted(this.opts.targetFacts, facts)!, isReview: false, isRetry: false };
  }

  /** Must be called once per answered question. */
  record(question: ScheduledQuestion, correct: boolean): void {
    this.asked++;
    if (question.isReview && !question.isRetry) this.reviewAsked++;
    if (question.isRetry) this.retryQueue = this.retryQueue.filter((r) => r.factId !== question.factId || r.wait > 0);
    for (const r of this.retryQueue) r.wait--;
    if (!correct && !this.retryQueue.some((r) => r.factId === question.factId)) {
      this.retryQueue.push({ factId: question.factId, wait: this.rng.int(this.config.retryAfterMin, this.config.retryAfterMax) });
    }
    this.recent.push(question.factId);
    if (this.recent.length > this.config.recentExclusion) this.recent.shift();
  }

  private pickMain(facts: FactStatsMap): string | null {
    if (this.opts.mode === 'weighted') return this.pickWeighted(this.opts.targetFacts, facts);
    const open = this.opts.targetFacts.filter((id) => (facts[id]?.mastery ?? 0) < this.opts.targetMastery);
    if (open.length === 0) return null;
    // Bucket rule: only facts at the lowest open mastery level are eligible. If that whole bucket
    // was just asked (e.g. a fact reset to 0 by a wrong answer), move on to the next bucket — the
    // retry queue brings the reset fact back shortly.
    const levels = [...new Set(open.map((id) => facts[id]?.mastery ?? 0))].sort((x, y) => x - y);
    for (const lvl of levels) {
      const bucket = open.filter((id) => (facts[id]?.mastery ?? 0) === lvl);
      const fresh = bucket.filter((id) => !this.recent.includes(id));
      if (fresh.length > 0) return this.rng.pick(fresh);
    }
    const last = this.recent[this.recent.length - 1];
    const lowest = open.filter((id) => (facts[id]?.mastery ?? 0) === levels[0]);
    const notLast = lowest.filter((id) => id !== last);
    return this.rng.pick(notLast.length > 0 ? notLast : lowest);
  }

  private pickWeighted(pool: readonly string[], facts: FactStatsMap): string | null {
    if (pool.length === 0) return null;
    let candidates = pool.filter((id) => !this.recent.includes(id));
    if (candidates.length === 0) {
      const last = this.recent[this.recent.length - 1];
      candidates = pool.filter((id) => id !== last);
      if (candidates.length === 0) candidates = [...pool];
    }
    return this.rng.weightedPick(candidates, (id) => (facts[id] ? weaknessWeight(facts[id], this.config) : 1));
  }
}
