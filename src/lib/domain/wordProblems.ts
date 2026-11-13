/**
 * Fishing word problems. The AI writes the stories, but this module decides
 * what counts as a valid problem, so a bad generation can never teach a wrong fact.
 */
import { z } from "zod";
import type { Card } from "./srs";

export const RawProblemSchema = z.object({
  a: z.number().int(),
  b: z.number().int(),
  story: z.string(),
  answer: z.number().int(),
});
export type RawProblem = z.infer<typeof RawProblemSchema>;

export const ProblemSetSchema = z.object({ problems: z.array(RawProblemSchema) });

export interface WordProblem extends Card {
  story: string;
  source: "ai" | "template";
}

const MAX_STORY_CHARS = 320;

/**
 * Checks a generated problem against the fact it was written for:
 * the math has to be right, both numbers have to appear in the story,
 * the story can't give away the answer, and it has to stay short.
 */
export function validateProblem(p: RawProblem, target: Card): boolean {
  const sameFact =
    (p.a === target.table && p.b === target.multiplier) ||
    (p.a === target.multiplier && p.b === target.table);
  if (!sameFact) return false;
  if (p.answer !== target.table * target.multiplier) return false;

  const story = p.story.trim();
  if (story.length < 20 || story.length > MAX_STORY_CHARS) return false;
  if (!story.includes("?")) return false;
  if (!hasNumber(story, p.a) || !hasNumber(story, p.b)) return false;
  if (p.answer !== p.a && p.answer !== p.b && hasNumber(story, p.answer)) return false;
  return true;
}

function hasNumber(text: string, n: number): boolean {
  return new RegExp(`(^|[^0-9])${n}([^0-9]|$)`).test(text);
}

const TEMPLATES: ReadonlyArray<(groups: number, each: number) => string> = [
  (g, e) => `${g} boats went out on the lake and each boat caught ${e} bass. How many bass were caught in all?`,
  (g, e) => `You packed ${g} tackle boxes with ${e} crankbaits in each one. How many crankbaits did you pack?`,
  (g, e) => `At the tournament, ${g} anglers each weighed in ${e} bass. How many bass were weighed in?`,
  (g, e) => `Your stringer has ${g} hooks, and you put ${e} worms on each hook over the day. How many worms did you use?`,
  (g, e) => `A guide fished ${g} coves and landed ${e} smallmouth in every cove. How many smallmouth did the guide land?`,
  (g, e) => `There are ${g} rows of lily pads with ${e} frogs sitting in each row. How many frogs are watching you fish?`,
];

export function templateProblem(card: Card, rng: () => number = Math.random): WordProblem {
  const make = TEMPLATES[Math.floor(rng() * TEMPLATES.length)];
  const flip = rng() < 0.5;
  const [g, e] = flip ? [card.multiplier, card.table] : [card.table, card.multiplier];
  return { ...card, story: make(g, e), source: "template" };
}

/** Matches valid generated problems to their target facts; any gaps get a template. */
export function assembleProblems(
  targets: readonly Card[],
  generated: readonly RawProblem[],
  rng: () => number = Math.random,
): WordProblem[] {
  const unused = [...generated];
  return targets.map((t) => {
    const i = unused.findIndex((p) => validateProblem(p, t));
    if (i === -1) return templateProblem(t, rng);
    const [p] = unused.splice(i, 1);
    return { table: t.table, multiplier: t.multiplier, story: p.story.trim(), source: "ai" as const };
  });
}
