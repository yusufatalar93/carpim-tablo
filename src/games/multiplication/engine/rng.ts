/** Seedable pseudo-random number generator (mulberry32). Deterministic for tests. */
export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number;
  /** Uniformly random element. Throws on empty array. */
  pick<T>(items: readonly T[]): T;
  /** Weighted random element; weights must be >= 0. Falls back to uniform if all weights are 0. */
  weightedPick<T>(items: readonly T[], weight: (item: T) => number): T;
}

export function createRng(seed: number = Date.now()): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (items) => {
      if (items.length === 0) throw new Error('pick() on empty array');
      return items[Math.floor(next() * items.length)];
    },
    weightedPick: (items, weight) => {
      if (items.length === 0) throw new Error('weightedPick() on empty array');
      const weights = items.map((i) => Math.max(0, weight(i)));
      const total = weights.reduce((s, w) => s + w, 0);
      if (total <= 0) return rng.pick(items);
      let r = next() * total;
      for (let i = 0; i < items.length; i++) {
        r -= weights[i];
        if (r < 0) return items[i];
      }
      return items[items.length - 1];
    },
  };
  return rng;
}
