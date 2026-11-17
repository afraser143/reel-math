import { and, asc, desc, eq, max, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { catches, factProgress, profiles } from "@/db/schema";
import { catchFish, getSpecies, isTrophy, type Water } from "@/lib/domain/fish";
import { guideTip } from "@/lib/domain/hints";
import { isValidFact, lakeStatuses, oceanUnlocked, type LakeStatus } from "@/lib/domain/lakes";
import { pickCards, review, type Card, type FactProgress } from "@/lib/domain/srs";
import { STANDARD_BADGES } from "@/lib/domain/gear";
import { HttpError, notFound } from "./errors";

/** Badges anyone can pick when creating an angler. Mods get more on the Gear page. */
export const AVATARS = STANDARD_BADGES;

export const NewProfileSchema = z.object({
  nickname: z.string().trim().min(1, "Pick a nickname").max(24, "Keep it under 24 letters"),
  avatar: z.enum(AVATARS),
});

/** The columns every profile lookup returns. */
const profileFields = {
  id: profiles.id,
  nickname: profiles.nickname,
  avatar: profiles.avatar,
  isMod: profiles.isMod,
  unlockAll: profiles.unlockAll,
  boat: profiles.boat,
  title: profiles.title,
};

export async function listProfiles(db: Db, userId: string) {
  return db
    .select(profileFields)
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .orderBy(asc(profiles.createdAt));
}

export async function createProfile(db: Db, userId: string, input: z.infer<typeof NewProfileSchema>) {
  const existing = await listProfiles(db, userId);
  if (existing.length >= 6) throw new HttpError(400, "That's a full boat: 6 anglers max");
  const [p] = await db
    .insert(profiles)
    .values({ userId, ...input })
    .returning(profileFields);
  return p;
}

/** Loads a profile, making sure it belongs to the signed-in parent. */
export async function getOwnedProfile(db: Db, userId: string, profileId: string) {
  if (!z.uuid().safeParse(profileId).success) throw notFound("No such angler");
  const [p] = await db
    .select(profileFields)
    .from(profiles)
    .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId)));
  if (!p) throw notFound("No such angler");
  return p;
}

/** Deletes an angler and, by cascade, all of their progress and catches. */
export async function deleteProfile(db: Db, userId: string, profileId: string): Promise<void> {
  const profile = await getOwnedProfile(db, userId, profileId);
  await db.delete(profiles).where(eq(profiles.id, profile.id));
}

export async function loadProgress(db: Db, profileId: string) {
  return db.select().from(factProgress).where(eq(factProgress.profileId, profileId));
}

/** Whether a grown-up has opened every lake for this angler. */
export async function unlockAllFor(db: Db, profileId: string): Promise<boolean> {
  const [row] = await db.select({ unlockAll: profiles.unlockAll }).from(profiles).where(eq(profiles.id, profileId));
  return row?.unlockAll ?? false;
}

export async function getLakes(db: Db, profileId: string): Promise<LakeStatus[]> {
  const [progress, all] = await Promise.all([loadProgress(db, profileId), unlockAllFor(db, profileId)]);
  return lakeStatuses(progress, all);
}

export async function startTrip(
  db: Db,
  profileId: string,
  opts: { focusTable?: number; water?: Water; now?: Date; rng?: () => number } = {},
): Promise<Card[]> {
  const [progress, all] = await Promise.all([loadProgress(db, profileId), unlockAllFor(db, profileId)]);
  const lakes = lakeStatuses(progress, all);
  const unlockedTables = lakes.filter((l) => l.unlocked).map((l) => l.table);
  const now = opts.now ?? new Date();

  if (opts.water === "salt") {
    if (!oceanUnlocked(progress, all)) throw new HttpError(403, "The ocean is still out of reach");
    // Every table at once, weakest facts first; hardly any brand-new ones out here.
    return pickCards(progress as FactProgress[], { unlockedTables, now, maxNew: 2, rng: opts.rng });
  }
  if (opts.focusTable !== undefined && !unlockedTables.includes(opts.focusTable)) {
    throw new HttpError(403, "That lake is still locked");
  }
  return pickCards(progress as FactProgress[], {
    unlockedTables,
    focusTable: opts.focusTable,
    now,
    rng: opts.rng,
  });
}

export const AnswerSchema = z.object({
  table: z.number().int(),
  multiplier: z.number().int(),
  answer: z.number().int().min(0).max(1000),
  responseMs: z.number().int().min(0).max(10 * 60_000),
  /** Word problems take reading time, so they're sized by a flat tournament bonus instead of speed. */
  mode: z.enum(["card", "word"]).default("card"),
  /** Which water he's fishing: the lakes, or the Open Ocean once it's open. */
  water: z.enum(["fresh", "salt"]).default("fresh"),
});
export type AnswerInput = z.input<typeof AnswerSchema>;

const WORD_PROBLEM_FISH_MS = 3_000;

export interface AnswerResult {
  correct: boolean;
  correctAnswer: number;
  box: number;
  tip?: string;
  fish?: {
    speciesId: string;
    speciesName: string;
    weightOz: number;
    water: Water;
    tier: "common" | "rare" | "legendary";
    lunker: boolean;
    personalBest: boolean;
  };
  unlockedLake?: { table: number; name: string };
  /** True on the answer that opens the Open Ocean. */
  unlockedOcean?: boolean;
}

/**
 * Grades an answer on the server (the client never decides if it was right),
 * updates spaced repetition, and lands a fish for correct answers.
 */
export async function recordAnswer(
  db: Db,
  profileId: string,
  input: AnswerInput,
  opts: { now?: Date; rng?: () => number } = {},
): Promise<AnswerResult> {
  const now = opts.now ?? new Date();
  const { table, multiplier } = input;
  if (!isValidFact(table, multiplier)) throw new HttpError(400, "Unknown fact");
  // Anything faster than this is a double-tap, not a real answer.
  const responseMs = Math.max(input.responseMs, 400);

  return db.transaction(async (tx) => {
    const progressBefore = await loadProgress(tx, profileId);
    const all = await unlockAllFor(tx, profileId);
    const before = lakeStatuses(progressBefore, all);
    const lake = before.find((l) => l.table === table);
    if (!lake?.unlocked) throw new HttpError(403, "That lake is still locked");
    const oceanWasOpen = oceanUnlocked(progressBefore, all);
    if (input.water === "salt" && !oceanWasOpen) throw new HttpError(403, "The ocean is still out of reach");

    const [current] = await tx
      .select()
      .from(factProgress)
      .where(
        and(
          eq(factProgress.profileId, profileId),
          eq(factProgress.table, table),
          eq(factProgress.multiplier, multiplier),
        ),
      )
      .for("update");

    const correctAnswer = table * multiplier;
    const correct = input.answer === correctAnswer;
    const next = review(current?.box ?? 0, correct, responseMs, now);

    await tx
      .insert(factProgress)
      .values({
        profileId,
        table,
        multiplier,
        box: next.box,
        dueAt: next.dueAt,
        correctCount: correct ? 1 : 0,
        wrongCount: correct ? 0 : 1,
        lastAnsweredAt: now,
      })
      .onConflictDoUpdate({
        target: [factProgress.profileId, factProgress.table, factProgress.multiplier],
        set: {
          box: next.box,
          dueAt: next.dueAt,
          correctCount: sql`${factProgress.correctCount} + ${correct ? 1 : 0}`,
          wrongCount: sql`${factProgress.wrongCount} + ${correct ? 0 : 1}`,
          lastAnsweredAt: now,
        },
      });

    const result: AnswerResult = { correct, correctAnswer, box: next.box };
    if (!correct) {
      result.tip = guideTip(table, multiplier);
      return result;
    }

    const fishMs = input.mode === "word" ? WORD_PROBLEM_FISH_MS : responseMs;
    const water = input.water ?? "fresh";
    const fish = catchFish(fishMs, current?.box ?? 0, opts.rng, water);
    const [{ best }] = await tx
      .select({ best: max(catches.weightOz) })
      .from(catches)
      .where(and(eq(catches.profileId, profileId), eq(catches.speciesId, fish.speciesId)));
    await tx.insert(catches).values({ profileId, ...fish, table, multiplier, responseMs, caughtAt: now });

    const species = getSpecies(fish.speciesId)!;
    result.fish = {
      ...fish,
      speciesName: species.name,
      water: species.water,
      tier: species.tier,
      lunker: isTrophy(fish.speciesId, fish.weightOz),
      personalBest: best !== null && fish.weightOz > best,
    };

    const progressAfter = await loadProgress(tx, profileId);
    const after = lakeStatuses(progressAfter, all);
    const opened = after.find((l, i) => l.unlocked && !before[i].unlocked);
    if (opened) result.unlockedLake = { table: opened.table, name: opened.name };
    if (!oceanWasOpen && oceanUnlocked(progressAfter, all)) result.unlockedOcean = true;
    return result;
  });
}

export async function getLivewell(db: Db, profileId: string) {
  const recent = await db
    .select()
    .from(catches)
    .where(eq(catches.profileId, profileId))
    .orderBy(desc(catches.caughtAt))
    .limit(30);
  const bySpecies = await db
    .select({
      speciesId: catches.speciesId,
      count: sql<number>`count(*)::int`,
      bestOz: max(catches.weightOz),
      totalOz: sql<number>`sum(${catches.weightOz})::int`,
    })
    .from(catches)
    .where(eq(catches.profileId, profileId))
    .groupBy(catches.speciesId);
  return { recent, bySpecies };
}
