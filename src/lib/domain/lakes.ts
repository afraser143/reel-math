/**
 * Each times table is a "lake". Lakes unlock in a teaching-friendly order:
 * the easy patterns (2s, 5s, 10s) first, the tricky ones (7s, 8s, 12s) last.
 */
export interface Lake {
  table: number;
  name: string;
  blurb: string;
}

export const LAKES: readonly Lake[] = [
  { table: 2, name: "Lily Pad Pond", blurb: "Double it! A calm pond to wet your line." },
  { table: 5, name: "Cattail Creek", blurb: "Count by fives along the reeds." },
  { table: 10, name: "Big Ten Reservoir", blurb: "Just add a zero. Easy fishing." },
  { table: 3, name: "Three Stump Cove", blurb: "Bass hide behind every third stump." },
  { table: 4, name: "Dockside Bay", blurb: "Double, then double again." },
  { table: 11, name: "Twin Point Lake", blurb: "Up to 9, the digits come in twins." },
  { table: 6, name: "Hydrilla Flats", blurb: "Thick weeds, bigger bass." },
  { table: 9, name: "Ninefoot Ledge", blurb: "Ten groups, take one away." },
  { table: 7, name: "Lucky Seven Lake", blurb: "Tricky water. Lunkers live here." },
  { table: 8, name: "Eight Mile River", blurb: "Double, double, double!" },
  { table: 12, name: "Tournament Waters", blurb: "The big leagues. Ten plus two." },
] as const;

export const MULTIPLIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const FACTS_PER_LAKE = MULTIPLIERS.length;

/** Facts at or above this box count toward unlocking the next lake. */
export const UNLOCK_BOX = 2;
/** How many facts in a lake must reach UNLOCK_BOX to open the next lake. */
export const UNLOCK_THRESHOLD = 9;
/** A fact at or above this box counts as mastered. */
export const MASTERED_BOX = 4;

export function getLake(table: number): Lake | undefined {
  return LAKES.find((l) => l.table === table);
}

export function isValidFact(table: number, multiplier: number): boolean {
  return (
    getLake(table) !== undefined &&
    Number.isInteger(multiplier) &&
    multiplier >= 1 &&
    multiplier <= 12
  );
}

export interface FactBox {
  table: number;
  multiplier: number;
  box: number;
}

export interface LakeStatus extends Lake {
  unlocked: boolean;
  /** Facts that have reached UNLOCK_BOX. */
  hooked: number;
  /** Facts that have reached MASTERED_BOX. */
  mastered: number;
  total: number;
}

/** Works out which lakes are open and how far along each one is. */
/** `unlockAll` is a grown-up's switch that opens every lake regardless of progress. */
export function lakeStatuses(progress: readonly FactBox[], unlockAll = false): LakeStatus[] {
  const boxOf = new Map<string, number>();
  for (const p of progress) boxOf.set(`${p.table}x${p.multiplier}`, p.box);

  let previousUnlocksNext = true;
  return LAKES.map((lake) => {
    let hooked = 0;
    let mastered = 0;
    for (const m of MULTIPLIERS) {
      const box = boxOf.get(`${lake.table}x${m}`) ?? 0;
      if (box >= UNLOCK_BOX) hooked++;
      if (box >= MASTERED_BOX) mastered++;
    }
    const unlocked = unlockAll || previousUnlocksNext;
    previousUnlocksNext = unlocked && hooked >= UNLOCK_THRESHOLD;
    return { ...lake, unlocked, hooked, mastered, total: FACTS_PER_LAKE };
  });
}

/** The Open Ocean: mixed review of every table, with saltwater fish. Opens like the next lake would. */
export const OCEAN = {
  name: "Open Ocean",
  blurb: "Every table, mixed together. Bigger fish, faster answers.",
} as const;

export function oceanUnlocked(progress: readonly FactBox[], unlockAll = false): boolean {
  if (unlockAll) return true;
  const last = lakeStatuses(progress).at(-1)!;
  return last.unlocked && last.hooked >= UNLOCK_THRESHOLD;
}
