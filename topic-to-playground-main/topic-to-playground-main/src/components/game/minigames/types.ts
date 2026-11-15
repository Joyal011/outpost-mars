export interface MiniGameProps {
  /** Deterministic seed for layouts. */
  seed: number;
  /** Called exactly once on Continue. Score is 0..1. */
  onDone: (score: number) => void;
}

/** Small deterministic random generator shared by the mini-games. */
export function seededRandom(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
