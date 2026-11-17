/**
 * Every correct answer lands a fish. Faster answers land heavier fish, and the
 * rarest species only bite on quick answers to facts he already knows well.
 * Bass live in the lakes; once every lake is open, the Open Ocean adds saltwater fish.
 */
export type Water = "fresh" | "salt";
export type Tier = "common" | "rare" | "legendary";
export type Shape = "bass" | "trout" | "flat" | "slim" | "mahi" | "billfish";

export interface Species {
  id: string;
  name: string;
  water: Water;
  minLb: number;
  maxLb: number;
  /** Relative chance of biting, among the species that can bite. */
  weight: number;
  tier: Tier;
  /** At or above this weight, it's a trophy (a "lunker" for bass). Saltwater lines sit near the
   *  top 15% of the size range, so a trophy stays special even for a fast answerer. */
  trophyLb: number;
  shape: Shape;
  color: string;
  /** A true fact, shown the first time an angler catches one. */
  fact: string;
}

const s = (
  id: string, name: string, water: Water, minLb: number, maxLb: number, weight: number,
  tier: Tier, trophyLb: number, shape: Shape, color: string,
): Species => ({ id, name, water, minLb, maxLb, weight, tier, trophyLb, shape, color, fact: FISH_FACTS[id] });

/**
 * One true fact per species. Kept to well-established facts; where a famous claim is disputed
 * (like exact sailfish speeds), it's phrased so it stays true.
 */
const FISH_FACTS: Record<string, string> = {
  largemouth:
    "Largemouth bass can swallow prey up to about half their own length: frogs, crayfish, and even the occasional duckling!",
  smallmouth:
    "Smallmouth bass love cool, clear, rocky water, and they're famous for leaping out of the water when they're hooked.",
  spotted: "Spotted bass get their name from the rows of little dark spots along their lower sides.",
  guadalupe: "The Guadalupe bass lives only in Texas rivers and streams, and it's the official state fish of Texas.",
  redeye: "Redeye bass are named for their bright red eyes. They live in clear, rocky streams in the southeastern U.S.",
  speckled_trout:
    "Speckled trout aren't trout at all! They're a kind of drum fish, also called spotted seatrout.",
  redfish:
    "Redfish have a black spot near the tail. Scientists think it may trick predators into attacking the wrong end.",
  flounder:
    "A baby flounder swims upright with an eye on each side. As it grows, one eye slowly moves over until both are on top!",
  snook:
    "Snook can't handle cold water, so they live in warm coastal places like southern Florida, often hiding near mangroves.",
  mahi: "Mahi-mahi grow amazingly fast: many reach full adult size in less than a year.",
  tarpon:
    "Tarpon can gulp air from the surface, so they can survive in warm water that has very little oxygen in it.",
  sailfish:
    "Sailfish are often called the fastest fish in the ocean. They can fold their giant sail flat to swim faster.",
  blue_marlin:
    "Blue marlin can weigh more than 1,000 pounds, and the biggest ones are almost always females.",
};

export const SPECIES: readonly Species[] = [
  s("largemouth", "Largemouth Bass", "fresh", 1, 9, 50, "common", 5, "bass", "#4d7c0f"),
  s("smallmouth", "Smallmouth Bass", "fresh", 0.75, 5.5, 30, "common", 5, "bass", "#a16207"),
  s("spotted", "Spotted Bass", "fresh", 0.75, 4.5, 15, "common", 5, "bass", "#65a30d"),
  s("guadalupe", "Guadalupe Bass", "fresh", 0.5, 3.5, 4, "rare", 5, "bass", "#15803d"),
  s("redeye", "Redeye Bass", "fresh", 0.5, 3, 1, "rare", 5, "bass", "#b91c1c"),

  s("speckled_trout", "Speckled Trout", "salt", 1, 7, 30, "common", 6, "trout", "#7d8ea3"),
  s("redfish", "Redfish", "salt", 3, 28, 30, "common", 24, "bass", "#c2410c"),
  s("flounder", "Flounder", "salt", 1, 9, 20, "common", 8, "flat", "#8b7d6b"),
  s("snook", "Snook", "salt", 3, 25, 15, "common", 22, "slim", "#9aa9b8"),
  s("mahi", "Mahi-Mahi", "salt", 8, 45, 10, "common", 40, "mahi", "#15a34a"),
  s("tarpon", "Tarpon", "salt", 40, 180, 4, "rare", 160, "slim", "#b8c4d0"),
  s("sailfish", "Sailfish", "salt", 30, 110, 3, "rare", 100, "billfish", "#1d4ed8"),
  s("blue_marlin", "Blue Marlin", "salt", 150, 650, 1, "legendary", 500, "billfish", "#1e3a8a"),
]; // prettier-ignore

/** Kept for older code paths: the bass "lunker" line. */
export const LUNKER_OZ = 5 * 16;

export function getSpecies(id: string): Species | undefined {
  return SPECIES.find((sp) => sp.id === id);
}

export function isTrophy(speciesId: string, weightOz: number): boolean {
  const sp = getSpecies(speciesId);
  return sp !== undefined && weightOz >= sp.trophyLb * 16;
}

/** 1 for an instant answer, falling to 0 at 10 seconds. */
export function speedScore(responseMs: number): number {
  return clamp((10_000 - responseMs) / 8_000, 0, 1);
}

export interface Catch {
  speciesId: string;
  weightOz: number;
}

export function catchFish(
  responseMs: number,
  box: number,
  rng: () => number = Math.random,
  water: Water = "fresh",
): Catch {
  const speed = speedScore(responseMs);
  // Rare fish need a quick answer to a fact he's seen before; a legendary one needs real fluency.
  const canBite = (sp: Species) =>
    sp.tier === "common" ||
    (sp.tier === "rare" && speed >= 0.6 && box >= 2) ||
    (sp.tier === "legendary" && speed >= 0.9 && box >= 3); // about 2.8 seconds or faster
  const pool = SPECIES.filter((sp) => sp.water === water && canBite(sp));
  const total = pool.reduce((sum, sp) => sum + sp.weight, 0);

  let roll = rng() * total;
  let species = pool[0];
  for (const sp of pool) {
    roll -= sp.weight;
    if (roll < 0) {
      species = sp;
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
