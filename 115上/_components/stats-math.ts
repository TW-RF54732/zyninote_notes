/** Math shared by the statistics widgets. Everything follows the course's conventions. */

export function sum(xs: number[]): number {
  return xs.reduce((s, x) => s + x, 0);
}

export function mean(xs: number[]): number {
  return sum(xs) / xs.length;
}

export function sorted(xs: number[]): number[] {
  return [...xs].sort((a, b) => a - b);
}

/**
 * Percentile by the course's position rule (3.6): i = p/100 · n on the sorted data.
 * Not an integer → round up and take that position; an integer → average positions i and i+1.
 */
export function percentile(xs: number[], p: number): { value: number; i: number; integer: boolean } {
  const s = sorted(xs);
  const i = (p / 100) * s.length;
  const integer = Math.abs(i - Math.round(i)) < 1e-9;
  if (integer) {
    const k = Math.round(i);
    const value = k >= s.length ? s[s.length - 1] : (s[k - 1] + s[k]) / 2;
    return { value, i, integer };
  }
  return { value: s[Math.ceil(i) - 1], i, integer };
}

export function variance(xs: number[], sample: boolean): number {
  const m = mean(xs);
  return sum(xs.map((x) => (x - m) ** 2)) / (xs.length - (sample ? 1 : 0));
}

/** C(n, k), computed multiplicatively so it stays exact for the sizes used here. */
export function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let r = 1;
  for (let j = 1; j <= k; j++) r = (r * (n - k + j)) / j;
  return Math.round(r);
}

export function factorial(n: number): number {
  let r = 1;
  for (let j = 2; j <= n; j++) r *= j;
  return r;
}

export function binomPmf(n: number, p: number, x: number): number {
  return comb(n, x) * p ** x * (1 - p) ** (n - x);
}

export function poissonPmf(m: number, x: number): number {
  let logFact = 0;
  for (let j = 2; j <= x; j++) logFact += Math.log(j);
  return Math.exp(x * Math.log(m) - m - logFact);
}

export function hyperPmf(N: number, K: number, n: number, x: number): number {
  return (comb(K, x) * comb(N - K, n - x)) / comb(N, n);
}

/** Small deterministic PRNG, so a "reshuffle" button gives reproducible samples per seed. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** k distinct indices from 0..n-1 in random order. */
export function pick(n: number, k: number, rand: () => number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = 0; i < Math.min(k, n); i++) {
    const j = i + Math.floor(rand() * (n - i));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, k);
}
