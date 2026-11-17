/**
 * Achievements for the trophy wall. Each is checked on the server after every answer, from
 * what's in the database plus the answer just given, so they can't be faked from the page.
 * Anything already done before achievements existed is awarded on the next catch.
 */
import { SPECIES } from "./fish";
import { FACTS_PER_LAKE, LAKES, MASTERED_BOX, UNLOCK_BOX, UNLOCK_THRESHOLD, type FactBox } from "./lakes";

/** Everything an achievement can look at. */
export interface AchievementContext {
  totalFish: number;
  speciesCaught: ReadonlySet<string>;
  /** The answer just given. */
  correct: boolean;
  /** Times this fact had been missed before this answer. */
  previousMisses: number;
  fish?: { speciesId: string; trophy: boolean; tier: "common" | "rare" | "legendary"; water: "fresh" | "salt" };
  correctStreak: number;
  fastStreak: number;
  progress: readonly FactBox[];
}

export interface Achievement {
  id: string;
  emoji: string;
  name: string;
  /** How to earn it, shown on the wall before it's earned. */
  hint: string;
  earned: (c: AchievementContext) => boolean;
}

const speciesIn = (water: "fresh" | "salt") => SPECIES.filter((s) => s.water === water).map((s) => s.id);

function lakeCounts(progress: readonly FactBox[]) {
  return LAKES.map((lake) => {
    const facts = progress.filter((p) => p.table === lake.table);
    return {
      hooked: facts.filter((p) => p.box >= UNLOCK_BOX).length,
      mastered: facts.filter((p) => p.box >= MASTERED_BOX).length,
    };
  });
}

export const LIGHTNING_MS = 2_000;
export const LIGHTNING_STREAK = 5;
export const HOT_STREAK = 20;
export const COMEBACK_MISSES = 3;

export const ACHIEVEMENTS: readonly Achievement[] = [
  { id: "first_catch", emoji: "🎣", name: "First Catch", hint: "Land your very first fish.", earned: (c) => c.totalFish >= 1 },
  { id: "full_stringer", emoji: "🪝", name: "Full Stringer", hint: "Land 25 fish.", earned: (c) => c.totalFish >= 25 },
  { id: "century_club", emoji: "💯", name: "Century Club", hint: "Land 100 fish.", earned: (c) => c.totalFish >= 100 },
  { id: "lake_legend", emoji: "🏅", name: "Legend of the Lake", hint: "Land 500 fish.", earned: (c) => c.totalFish >= 500 },
  { id: "first_lunker", emoji: "🏆", name: "Lunker!", hint: "Land a trophy-sized fish.", earned: (c) => Boolean(c.fish?.trophy) },
  { id: "rare_find", emoji: "✨", name: "Rare Find", hint: "Catch a rare fish. They only bite on lightning-fast answers.", earned: (c) => c.fish?.tier === "rare" },
  { id: "legend", emoji: "🌟", name: "Legend", hint: "Catch the legendary blue marlin.", earned: (c) => c.fish?.tier === "legendary" },
  {
    id: "bass_collector", emoji: "🐟", name: "Bass Collector", hint: "Catch every kind of bass in the lakes.",
    earned: (c) => speciesIn("fresh").every((id) => c.speciesCaught.has(id)),
  },
  { id: "sea_legs", emoji: "⛵", name: "Sea Legs", hint: "Catch your first saltwater fish in the Open Ocean.", earned: (c) => c.fish?.water === "salt" },
  {
    id: "salt_collector", emoji: "🌊", name: "Saltwater Collector", hint: "Catch every kind of fish in the Open Ocean.",
    earned: (c) => speciesIn("salt").every((id) => c.speciesCaught.has(id)),
  },
  {
    id: "lightning_hands", emoji: "⚡", name: "Lightning Hands",
    hint: `Get ${LIGHTNING_STREAK} right in a row, each in under ${LIGHTNING_MS / 1000} seconds.`,
    earned: (c) => c.fastStreak >= LIGHTNING_STREAK,
  },
  { id: "on_fire", emoji: "🔥", name: "On Fire", hint: `Get ${HOT_STREAK} right in a row.`, earned: (c) => c.correctStreak >= HOT_STREAK },
  {
    id: "comeback_kid", emoji: "💪", name: "Comeback Kid",
    hint: `Get a fact right that you'd missed ${COMEBACK_MISSES} or more times.`,
    earned: (c) => c.correct && c.previousMisses >= COMEBACK_MISSES,
  },
  {
    id: "lake_hooked", emoji: "🗺️", name: "Lake Hooked", hint: `Hook ${UNLOCK_THRESHOLD} facts in any lake.`,
    earned: (c) => lakeCounts(c.progress).some((l) => l.hooked >= UNLOCK_THRESHOLD),
  },
  {
    id: "lake_master", emoji: "👑", name: "Lake Master", hint: "Master every fact in one lake.",
    earned: (c) => lakeCounts(c.progress).some((l) => l.mastered >= FACTS_PER_LAKE),
  },
]; // prettier-ignore

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/** Achievements earned now that weren't already. */
export function newlyEarned(context: AchievementContext, already: ReadonlySet<string>): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !already.has(a.id) && a.earned(context));
}
