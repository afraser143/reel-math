import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { sql } from "drizzle-orm";
import type { Db } from "@/db";
import { aiUsage } from "@/db/schema";
import type { Card } from "@/lib/domain/srs";
import { lakeStatuses } from "@/lib/domain/lakes";
import {
  assembleProblems,
  ProblemSetSchema,
  type RawProblem,
  type WordProblem,
} from "@/lib/domain/wordProblems";
import { loadProgress, startTrip } from "./fishing";

export const PROBLEMS_PER_SET = 5;

/** Anything that can turn facts into raw problems. Swapped for a fake in tests. */
export type ProblemGenerator = (facts: readonly Card[]) => Promise<RawProblem[]>;

const SYSTEM_PROMPT = `You write multiplication word problems for a 9-year-old who loves bass fishing.

For each fact you're given, write one short story problem set on the water: boats, docks, coves,
lures, tackle boxes, weigh-ins, tournaments, bobbers, live wells. Vary the scene from problem to problem.

Rules for every problem:
- Use the two given numbers as digits, exactly as given, and make the answer their product.
- Keep it to one or two short sentences plus a question ending in "?". Third-grade reading level.
- Never state the answer in the story.
- Keep it kind and safe for a young child. Don't use real people's names.

Return one problem per fact, in the same order. Set "a" and "b" to the two numbers and "answer" to their product.`;

let client: Anthropic | undefined;

/** Writes word problems with Claude. Returns [] on any failure so callers can fall back to templates. */
export const claudeGenerator: ProblemGenerator = async (facts) => {
  client ??= new Anthropic({ timeout: 30_000, maxRetries: 1 });
  const list = facts.map((f, i) => `${i + 1}. ${f.table} × ${f.multiplier}`).join("\n");
  try {
    const response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 8000,
      // If the request is declined, the API retries it on a fallback model in the same call.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(ProblemSetSchema) },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Write one fishing word problem for each fact:\n${list}` }],
    });
    if (response.stop_reason !== "end_turn" || !response.parsed_output) {
      console.warn(`Word problem generation stopped early: ${response.stop_reason}`);
      return [];
    }
    return response.parsed_output.problems;
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.warn(`Word problem generation failed (${err.status}): ${err.message}`);
    } else {
      console.warn("Word problem generation failed:", err);
    }
    return [];
  }
};

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

function dailyLimit(): number {
  const n = Number(process.env.AI_DAILY_LIMIT);
  return Number.isFinite(n) && n >= 0 ? n : 30;
}

/** Atomically counts one AI call against the parent's daily limit. Returns false once it's used up. */
export async function takeAiCredit(db: Db, userId: string, now = new Date(), limit = dailyLimit()) {
  const day = now.toISOString().slice(0, 10);
  const [row] = await db
    .insert(aiUsage)
    .values({ userId, day, count: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.day],
      set: { count: sql`${aiUsage.count} + 1` },
    })
    .returning({ count: aiUsage.count });
  return row.count <= limit;
}

/**
 * Picks the facts he struggles with most, so the stories practise his weak spots.
 * Facts he has missed come first; the regular trip picker fills the rest.
 */
export async function pickWordProblemFacts(db: Db, profileId: string, now = new Date()): Promise<Card[]> {
  const progress = await loadProgress(db, profileId);
  const unlocked = new Set(lakeStatuses(progress).filter((l) => l.unlocked).map((l) => l.table));
  const weak = progress
    .filter((p) => unlocked.has(p.table) && p.box >= 1 && p.multiplier > 1)
    .sort((a, b) => a.box - b.box || b.wrongCount - a.wrongCount)
    .slice(0, PROBLEMS_PER_SET)
    .map(({ table, multiplier }) => ({ table, multiplier }));

  if (weak.length < PROBLEMS_PER_SET) {
    const seen = new Set(weak.map((c) => `${c.table}x${c.multiplier}`));
    for (const c of await startTrip(db, profileId, { now })) {
      if (weak.length >= PROBLEMS_PER_SET) break;
      if (c.multiplier > 1 && !seen.has(`${c.table}x${c.multiplier}`)) weak.push(c);
    }
  }
  return weak;
}

export async function getWordProblems(
  db: Db,
  userId: string,
  profileId: string,
  generator: ProblemGenerator | null,
): Promise<WordProblem[]> {
  const facts = await pickWordProblemFacts(db, profileId);
  let generated: RawProblem[] = [];
  if (generator && facts.length > 0 && (await takeAiCredit(db, userId))) {
    generated = await generator(facts);
  }
  return assembleProblems(facts, generated);
}

