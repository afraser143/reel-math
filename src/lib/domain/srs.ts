/**
 * Leitner-style spaced repetition.
 *
 * Every fact lives in a box from 0 (never seen) to MAX_BOX. A quick correct
 * answer moves it up a box, so it comes back less often. A miss drops it to
 * box 1 and brings it back almost right away.
 */
import { LAKES, MULTIPLIERS, type FactBox } from "./lakes";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export const MAX_BOX = 5;
/** How long until a fact in box N is due again. */
export const BOX_INTERVALS_MS = [0, 10 * MINUTE, 1 * DAY, 3 * DAY, 7 * DAY, 14 * DAY] as const;
/** A missed fact comes back after this long. */
export const RETRY_MS = 1 * MINUTE;
/** Correct answers slower than this don't move a fact up. Fluency is about recall, not counting. */
export const FLUENT_MS = 6_000;

export interface ReviewResult {
  box: number;
  dueAt: Date;
}

export function review(box: number, correct: boolean, responseMs: number, now: Date): ReviewResult {
  if (!correct) {
    return { box: 1, dueAt: new Date(now.getTime() + RETRY_MS) };
  }
  const next = responseMs <= FLUENT_MS ? Math.min(box + 1, MAX_BOX) : Math.max(box, 1);
  return { box: next, dueAt: new Date(now.getTime() + BOX_INTERVALS_MS[next]) };
}

export interface FactProgress extends FactBox {
  dueAt: Date;
}

export interface Card {
  table: number;
  multiplier: number;
}

export interface PickOptions {
  /** Tables the angler may fish. */
  unlockedTables: readonly number[];
  /** Fish only this table, if set. */
  focusTable?: number;
  now: Date;
  count?: number;
  /** Cap on brand-new facts per trip, so a session isn't all unknowns. */
  maxNew?: number;
  rng?: () => number;
}

/**
 * Chooses the cards for one fishing trip, in priority order:
 * facts that are due, then a few new facts from the newest lake, then the
 * weakest facts that aren't due yet. Returns them shuffled.
 */
export function pickCards(progress: readonly FactProgress[], opts: PickOptions): Card[] {
  const { now, count = 10, maxNew = 4, rng = Math.random } = opts;
  const tables = opts.focusTable !== undefined ? [opts.focusTable] : [...opts.unlockedTables];
  if (tables.length === 0) return [];

  const known = new Map<string, FactProgress>();
  for (const p of progress) known.set(`${p.table}x${p.multiplier}`, p);

  const due: FactProgress[] = [];
  const notDue: FactProgress[] = [];
  const freshByTable = new Map<number, Card[]>();

  for (const table of tables) {
    for (const multiplier of MULTIPLIERS) {
      const p = known.get(`${table}x${multiplier}`);
      if (!p || p.box === 0) {
        freshByTable.set(table, [...(freshByTable.get(table) ?? []), { table, multiplier }]);
      } else if (p.dueAt.getTime() <= now.getTime()) {
        due.push(p);
      } else {
        notDue.push(p);
      }
    }
  }

  // New facts come from one lake at a time: the earliest, in teaching order, that still has
  // facts he hasn't tried. (Even with every lake unlocked, 3s come before 12s.)
  const ordered = LAKES.map((l) => l.table).filter((t) => tables.includes(t));
  const frontier = opts.focusTable ?? ordered.find((t) => freshByTable.has(t));
  const fresh = frontier === undefined ? [] : (freshByTable.get(frontier) ?? []);

  const byUrgency = (a: FactProgress, b: FactProgress) =>
    a.box - b.box || a.dueAt.getTime() - b.dueAt.getTime();
  due.sort(byUrgency);
  notDue.sort(byUrgency);
  shuffle(fresh, rng);

  const picked: Card[] = [];
  const take = (cards: readonly Card[], limit: number) => {
    for (const c of cards) {
      if (picked.length >= limit) break;
      picked.push({ table: c.table, multiplier: c.multiplier });
    }
  };

  take(due, count);
  const newSlots = Math.min(count, picked.length + maxNew);
  take(fresh.slice(0, maxNew), newSlots);
  take(notDue, count);
  // Still short (e.g. a brand-new angler): fill with more new facts.
  take(fresh.slice(maxNew), count);

  return shuffle(picked, rng);
}

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
