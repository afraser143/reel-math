import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDb, withVerifiedSsl, type Db } from "@/db";
import { LAKES, MULTIPLIERS, UNLOCK_THRESHOLD } from "@/lib/domain/lakes";
import { aiUsage, catches, factProgress, profiles, sessions, users } from "@/db/schema";
import { createSession, deleteAccount, deleteSession, login, register, userForToken } from "./auth";
import { HttpError } from "./errors";
import { createProfile, deleteProfile, getLakes, getLivewell, getOwnedProfile, recordAnswer, startTrip } from "./fishing";
import { getWordProblems, takeAiCredit, type ProblemGenerator } from "./wordProblems";

let db: Db;
beforeEach(async () => {
  db = await createDb(); // fresh in-memory Postgres per test
});

const creds = { email: "parent@example.com", password: "correct horse battery" };

async function setup() {
  const user = await register(db, creds);
  const profile = await createProfile(db, user.id, { nickname: "Bass Boss", avatar: "🎣" });
  return { user, profile };
}

describe("auth", () => {
  it("registers, logs in, and rejects bad passwords", async () => {
    const user = await register(db, creds);
    expect((await login(db, creds)).id).toBe(user.id);
    await expect(login(db, { ...creds, password: "wrong password" })).rejects.toMatchObject({ status: 401 });
    await expect(login(db, { ...creds, email: "nobody@example.com" })).rejects.toMatchObject({ status: 401 });
  });

  it("refuses a duplicate email", async () => {
    await register(db, creds);
    await expect(register(db, creds)).rejects.toMatchObject({ status: 409 });
  });

  it("resolves sessions until they expire or are deleted", async () => {
    const user = await register(db, creds);
    const now = new Date();
    const { token, expiresAt } = await createSession(db, user.id, now);
    expect(await userForToken(db, token, now)).toMatchObject({ id: user.id });
    expect(await userForToken(db, token, new Date(expiresAt.getTime() + 1))).toBeNull();
    await deleteSession(db, token);
    expect(await userForToken(db, token, now)).toBeNull();
  });
});

describe("profiles", () => {
  it("won't show one parent's angler to another parent", async () => {
    const { profile } = await setup();
    const other = await register(db, { ...creds, email: "other@example.com" });
    await expect(getOwnedProfile(db, other.id, profile.id)).rejects.toBeInstanceOf(HttpError);
    await expect(getOwnedProfile(db, other.id, "not-a-uuid")).rejects.toMatchObject({ status: 404 });
  });
});

describe("fishing", () => {
  it("grades on the server and lands a fish for a correct answer", async () => {
    const { profile } = await setup();
    const right = await recordAnswer(db, profile.id, { table: 2, multiplier: 7, answer: 14, responseMs: 2000 });
    expect(right.correct).toBe(true);
    expect(right.fish).toBeDefined();
    expect(right.box).toBe(1);

    const wrong = await recordAnswer(db, profile.id, { table: 2, multiplier: 7, answer: 15, responseMs: 2000 });
    expect(wrong).toMatchObject({ correct: false, correctAnswer: 14, box: 1 });
    expect(wrong.fish).toBeUndefined();
    expect(wrong.tip).toContain("14");

    const livewell = await getLivewell(db, profile.id);
    expect(livewell.recent).toHaveLength(1);
  });

  it("rejects answers for locked lakes and made-up facts", async () => {
    const { profile } = await setup();
    await expect(recordAnswer(db, profile.id, { table: 7, multiplier: 8, answer: 56, responseMs: 1000 })).rejects.toMatchObject({ status: 403 });
    await expect(recordAnswer(db, profile.id, { table: 13, multiplier: 2, answer: 26, responseMs: 1000 })).rejects.toMatchObject({ status: 400 });
    await expect(startTrip(db, profile.id, { focusTable: 7 })).rejects.toMatchObject({ status: 403 });
  });

  it("unlocks the next lake after enough facts are hooked", async () => {
    const { profile } = await setup();
    const [first, second] = LAKES;
    let unlocked;
    let t = Date.now();
    // Two quick correct answers per fact move each one to box 2.
    for (const m of MULTIPLIERS.slice(0, UNLOCK_THRESHOLD)) {
      for (let i = 0; i < 2; i++) {
        const r = await recordAnswer(
          db,
          profile.id,
          { table: first.table, multiplier: m, answer: first.table * m, responseMs: 1500 },
          { now: new Date((t += 60_000)) },
        );
        unlocked ??= r.unlockedLake;
      }
    }
    expect(unlocked).toEqual({ table: second.table, name: second.name });
    const lakes = await getLakes(db, profile.id);
    expect(lakes[1].unlocked).toBe(true);
    expect((await startTrip(db, profile.id, { focusTable: second.table })).length).toBe(10);
  });

  it("flags a personal best", async () => {
    const { profile } = await setup();
    // rng 0 always picks the first species; speed decides the size.
    const slow = await recordAnswer(db, profile.id, { table: 2, multiplier: 3, answer: 6, responseMs: 9000 }, { rng: () => 0 });
    const fast = await recordAnswer(db, profile.id, { table: 2, multiplier: 4, answer: 8, responseMs: 1000 }, { rng: () => 0 });
    expect(slow.fish!.personalBest).toBe(false); // first fish has nothing to beat
    expect(fast.fish!.personalBest).toBe(true);
  });
});

describe("word problems", () => {
  it("uses valid AI problems and falls back to templates for bad ones", async () => {
    const { user, profile } = await setup();
    const generator = vi.fn<ProblemGenerator>(async (facts) =>
      facts.map((f, i) => ({
        a: f.table,
        b: f.multiplier,
        // Make every other problem's math wrong.
        answer: f.table * f.multiplier + (i % 2),
        story: `${f.table} anglers each caught ${f.multiplier} bass at the lake. How many bass?`,
      })),
    );
    const problems = await getWordProblems(db, user.id, profile.id, generator);
    expect(problems).toHaveLength(5);
    expect(problems.map((p) => p.source)).toEqual(["ai", "template", "ai", "template", "ai"]);
    // No personal info reaches the model: it only gets the facts.
    const sent = generator.mock.calls[0][0];
    expect(JSON.stringify(sent)).not.toContain("Bass Boss");
  });

  it("stops calling the AI after the daily limit", async () => {
    const { user } = await setup();
    const now = new Date();
    expect(await takeAiCredit(db, user.id, now, 2)).toBe(true);
    expect(await takeAiCredit(db, user.id, now, 2)).toBe(true);
    expect(await takeAiCredit(db, user.id, now, 2)).toBe(false);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    expect(await takeAiCredit(db, user.id, tomorrow, 2)).toBe(true);
  });

  it("works with no AI at all", async () => {
    const { user, profile } = await setup();
    const problems = await getWordProblems(db, user.id, profile.id, null);
    expect(problems).toHaveLength(5);
    expect(problems.every((p) => p.source === "template")).toBe(true);
  });
});

describe("deleting data", () => {
  type AnyTable = typeof users | typeof sessions | typeof profiles | typeof factProgress | typeof catches | typeof aiUsage;
  const count = async (table: AnyTable) =>
    (await db.select().from(table)).length;

  it("deletes an angler and all their progress, but only for its own parent", async () => {
    const { user, profile } = await setup();
    await recordAnswer(db, profile.id, { table: 2, multiplier: 3, answer: 6, responseMs: 1000 });
    const other = await register(db, { ...creds, email: "other@example.com" });

    await expect(deleteProfile(db, other.id, profile.id)).rejects.toMatchObject({ status: 404 });
    expect(await count(profiles)).toBe(1);

    await deleteProfile(db, user.id, profile.id);
    expect(await count(profiles)).toBe(0);
    expect(await count(factProgress)).toBe(0);
    expect(await count(catches)).toBe(0);
  });

  it("deletes a whole account only with the right password", async () => {
    const { user, profile } = await setup();
    await recordAnswer(db, profile.id, { table: 2, multiplier: 3, answer: 6, responseMs: 1000 });
    await createSession(db, user.id);
    await takeAiCredit(db, user.id);

    await expect(deleteAccount(db, user.id, "wrong password")).rejects.toMatchObject({ status: 401 });
    expect(await count(users)).toBe(1);

    await deleteAccount(db, user.id, creds.password);
    for (const table of [users, sessions, profiles, factProgress, catches, aiUsage]) {
      expect(await count(table)).toBe(0);
    }
  });
});

describe("withVerifiedSsl", () => {
  it("pins weaker SSL modes to verify-full and leaves everything else alone", () => {
    const neon = "postgresql://u:p@ep-x.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
    expect(withVerifiedSsl(neon)).toBe(
      "postgresql://u:p@ep-x.us-east-2.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require",
    );
    expect(withVerifiedSsl("postgres://u@h/db?sslmode=prefer")).toContain("sslmode=verify-full");
    expect(withVerifiedSsl("postgres://u@h/db?sslmode=disable")).toContain("sslmode=disable");
    expect(withVerifiedSsl("postgres://u@localhost:5432/db")).toBe("postgres://u@localhost:5432/db");
  });
});
