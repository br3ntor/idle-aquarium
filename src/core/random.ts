/**
 * Small deterministic PRNG. A fixed seed gives the tank the same rocks,
 * plants and starting fish every time while we iterate.
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomBetween(
  random: () => number,
  min: number,
  max: number,
): number {
  return min + random() * (max - min);
}

export function randomPick<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)] as T;
}
