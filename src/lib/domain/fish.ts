/**
 * Every correct answer lands a bass. Faster answers land heavier fish, and
 * rare species only bite on quick answers to facts he already knows well.
 */
export interface Species {
  id: string;
  name: string;
  minLb: number;
  maxLb: number;
  /** Relative chance of biting. */
  weight: number;
  rare: boolean;
  color: string;
}

export const SPECIES: readonly Species[] = [
  { id: "largemouth", name: "Largemouth Bass", minLb: 1, maxLb: 9, weight: 50, rare: false, color: "#4d7c0f" },
  { id: "smallmouth", name: "Smallmouth Bass", minLb: 0.75, maxLb: 5.5, weight: 30, rare: false, color: "#a16207" },
  { id: "spotted", name: "Spotted Bass", minLb: 0.75, maxLb: 4.5, weight: 15, rare: false, color: "#65a30d" },
  { id: "guadalupe", name: "Guadalupe Bass", minLb: 0.5, maxLb: 3.5, weight: 4, rare: true, color: "#15803d" },
  { id: "redeye", name: "Redeye Bass", minLb: 0.5, maxLb: 3, weight: 1, rare: true, color: "#b91c1c" },
] as const;

/** A fish at or above this weight is a lunker. */
export const LUNKER_OZ = 5 * 16;

export function getSpecies(id: string): Species | undefined {
  return SPECIES.find((s) => s.id === id);
}

/** 1 for an instant answer, falling to 0 at 10 seconds. */
export function speedScore(responseMs: number): number {
  return clamp((10_000 - responseMs) / 8_000, 0, 1);
}

export interface Catch {
  speciesId: string;
  weightOz: number;
}

export function catchFish(responseMs: number, box: number, rng: () => number = Math.random): Catch {
  const speed = speedScore(responseMs);
  const rareEligible = speed >= 0.6 && box >= 2;
  const pool = SPECIES.filter((s) => rareEligible || !s.rare);
  const total = pool.reduce((sum, s) => sum + s.weight, 0);

  let roll = rng() * total;
  let species = pool[0];
  for (const s of pool) {
    roll -= s.weight;
    if (roll < 0) {
      species = s;
      break;
    }
  }

  const size = clamp(0.65 * speed + 0.35 * rng(), 0, 1);
  // Squaring the size keeps true lunkers rare even on fast answers.
  const lb = species.minLb + (species.maxLb - species.minLb) * size * size;
  return { speciesId: species.id, weightOz: Math.max(1, Math.round(lb * 16)) };
}

export function formatWeight(oz: number): string {
  const lb = Math.floor(oz / 16);
  const rest = oz % 16;
  if (lb === 0) return `${rest} oz`;
  if (rest === 0) return `${lb} lb`;
  return `${lb} lb ${rest} oz`;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
