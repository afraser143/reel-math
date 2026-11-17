import { describe, expect, it } from "vitest";
import { catchFish, formatWeight, isTrophy, SPECIES, speedScore } from "./fish";
import { guideTip } from "./hints";
import { LAKES, lakeStatuses, MULTIPLIERS, oceanUnlocked, UNLOCK_THRESHOLD } from "./lakes";
import { BOX_INTERVALS_MS, FLUENT_MS, MAX_BOX, pickCards, RETRY_MS, review, type FactProgress } from "./srs";
import { assembleProblems, templateProblem, validateProblem } from "./wordProblems";

/** Deterministic RNG so tests don't flake. */
function seeded(seed = 42) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32;
    return s / 2 ** 32;
  };
}

const now = new Date("2026-06-01T12:00:00Z");

describe("review", () => {
  it("moves a fact up a box on a quick correct answer", () => {
    const r = review(2, true, 2000, now);
    expect(r.box).toBe(3);
    expect(r.dueAt.getTime()).toBe(now.getTime() + BOX_INTERVALS_MS[3]);
  });

  it("does not promote a slow correct answer", () => {
    expect(review(3, true, FLUENT_MS + 1, now).box).toBe(3);
    expect(review(0, true, FLUENT_MS + 1, now).box).toBe(1);
  });

  it("drops a missed fact to box 1 and brings it back soon", () => {
    const r = review(5, false, 1000, now);
    expect(r.box).toBe(1);
    expect(r.dueAt.getTime()).toBe(now.getTime() + RETRY_MS);
  });

  it("never goes past the top box", () => {
    expect(review(MAX_BOX, true, 1000, now).box).toBe(MAX_BOX);
  });
});

describe("lakeStatuses", () => {
  it("opens only the first lake for a new angler", () => {
    const lakes = lakeStatuses([]);
    expect(lakes[0].unlocked).toBe(true);
    expect(lakes.slice(1).every((l) => !l.unlocked)).toBe(true);
  });

  it("opens the next lake once enough facts are hooked", () => {
    const first = LAKES[0].table;
    const progress = MULTIPLIERS.slice(0, UNLOCK_THRESHOLD).map((m) => ({ table: first, multiplier: m, box: 2 }));
    const lakes = lakeStatuses(progress);
    expect(lakes[1].unlocked).toBe(true);
    expect(lakes[2].unlocked).toBe(false);

    const short = lakeStatuses(progress.slice(1));
    expect(short[1].unlocked).toBe(false);
  });
});

describe("pickCards", () => {
  const p = (table: number, multiplier: number, box: number, dueOffsetMs: number): FactProgress => ({
    table,
    multiplier,
    box,
    dueAt: new Date(now.getTime() + dueOffsetMs),
  });

  it("gives a new angler ten new facts from the first lake", () => {
    const cards = pickCards([], { unlockedTables: [2], now, rng: seeded() });
    expect(cards).toHaveLength(10);
    expect(cards.every((c) => c.table === 2)).toBe(true);
    expect(new Set(cards.map((c) => c.multiplier)).size).toBe(10);
  });

  it("puts due facts first and limits new ones", () => {
    const progress = [
      ...MULTIPLIERS.map((m) => p(2, m, 3, -1000)), // all 2s due
      p(5, 1, 2, -1000),
    ];
    const cards = pickCards(progress, { unlockedTables: [2, 5], now, count: 10, rng: seeded() });
    expect(cards).toHaveLength(10);
    // 13 facts are due, so there's no room for anything new.
    const due = new Set(progress.map((x) => `${x.table}x${x.multiplier}`));
    expect(cards.every((c) => due.has(`${c.table}x${c.multiplier}`))).toBe(true);
  });

  it("adds at most maxNew new facts when few are due", () => {
    const progress = [p(2, 1, 1, -1000), p(2, 2, 4, 1e9)];
    const cards = pickCards(progress, { unlockedTables: [2], now, count: 10, maxNew: 4, rng: seeded() });
    const fresh = cards.filter((c) => !progress.some((x) => x.multiplier === c.multiplier));
    // 1 due + 4 new + 1 not-due = 6, then more new facts fill the trip.
    expect(cards).toHaveLength(10);
    expect(fresh.length).toBe(8);
  });

  it("respects a focus lake", () => {
    const cards = pickCards([], { unlockedTables: [2, 5, 10], focusTable: 5, now, rng: seeded() });
    expect(cards.every((c) => c.table === 5)).toBe(true);
  });
});

describe("catchFish", () => {
  it("always lands a known species with a sensible weight", () => {
    const rng = seeded(7);
    for (let i = 0; i < 500; i++) {
      const fish = catchFish(Math.floor(rng() * 12000), Math.floor(rng() * 6), rng);
      const species = SPECIES.find((s) => s.id === fish.speciesId)!;
      expect(species).toBeDefined();
      expect(fish.weightOz).toBeGreaterThanOrEqual(Math.round(species.minLb * 16) - 1);
      expect(fish.weightOz).toBeLessThanOrEqual(Math.round(species.maxLb * 16));
    }
  });

  it("only gives rare species for fast answers on known facts", () => {
    const rng = seeded(3);
    const isRare = (id: string) => SPECIES.find((s) => s.id === id)!.tier !== "common";
    let rareOnFast = 0;
    for (let i = 0; i < 500; i++) {
      expect(isRare(catchFish(9000, 5, rng).speciesId)).toBe(false); // slow answer
      expect(isRare(catchFish(1000, 0, rng).speciesId)).toBe(false); // brand-new fact
      if (isRare(catchFish(1000, 5, rng).speciesId)) rareOnFast++;
    }
    expect(rareOnFast).toBeGreaterThan(0);
  });

  it("lands heavier fish on faster answers, on average", () => {
    const avg = (ms: number) => {
      const rng = seeded(11);
      let total = 0;
      for (let i = 0; i < 400; i++) total += catchFish(ms, 1, rng).weightOz;
      return total / 400;
    };
    expect(avg(1500)).toBeGreaterThan(avg(9000));
    expect(speedScore(500)).toBe(1);
    expect(speedScore(20000)).toBe(0);
  });

  it("formats weights the way anglers say them", () => {
    expect(formatWeight(12)).toBe("12 oz");
    expect(formatWeight(32)).toBe("2 lb");
    expect(formatWeight(67)).toBe("4 lb 3 oz");
  });
});

describe("guideTip", () => {
  it("gives a tip that ends at the right answer for every fact", () => {
    for (const lake of LAKES) {
      for (const m of MULTIPLIERS) {
        const tip = guideTip(lake.table, m);
        expect(tip).toMatch(new RegExp(`${lake.table * m}\\.$`));
      }
    }
  });

  it("uses the easier factor's trick", () => {
    expect(guideTip(7, 2)).toContain("double");
    expect(guideTip(9, 7)).toContain("Times 9");
  });
});

describe("word problems", () => {
  const target = { table: 7, multiplier: 8 };
  const good = { a: 7, b: 8, answer: 56, story: "7 boats each caught 8 bass at the tournament. How many bass?" };

  it("accepts a correct problem in either order", () => {
    expect(validateProblem(good, target)).toBe(true);
    expect(validateProblem({ ...good, a: 8, b: 7 }, target)).toBe(true);
  });

  it("rejects wrong math, missing numbers, giveaways, and runaway stories", () => {
    expect(validateProblem({ ...good, answer: 54 }, target)).toBe(false);
    expect(validateProblem({ ...good, a: 6 }, target)).toBe(false);
    expect(validateProblem({ ...good, story: "Seven boats each caught 8 bass. How many?" }, target)).toBe(false);
    expect(validateProblem({ ...good, story: "7 boats caught 8 bass each, 56 total. How many?" }, target)).toBe(false);
    expect(validateProblem({ ...good, story: "7 boats each caught 8 bass." }, target)).toBe(false);
    expect(validateProblem({ ...good, story: `${good.story} ${"x".repeat(400)}` }, target)).toBe(false);
  });

  it("does not mistake 18 for 8", () => {
    expect(validateProblem({ ...good, story: "7 boats each caught 18 bass. How many bass?" }, target)).toBe(false);
  });

  it("templates always produce valid problems", () => {
    const rng = seeded(5);
    for (const lake of LAKES) {
      for (const m of MULTIPLIERS.slice(1)) {
        const card = { table: lake.table, multiplier: m };
        const t = templateProblem(card, rng);
        expect(validateProblem({ a: card.table, b: card.multiplier, answer: card.table * m, story: t.story }, card)).toBe(true);
      }
    }
  });

  it("fills gaps with templates when the AI gets one wrong", () => {
    const targets = [target, { table: 6, multiplier: 4 }];
    const problems = assembleProblems(targets, [{ ...good }, { a: 6, b: 4, answer: 25, story: "6 docks, 4 boats. How many?" }]);
    expect(problems.map((p) => p.source)).toEqual(["ai", "template"]);
    expect(problems[1]).toMatchObject({ table: 6, multiplier: 4 });
  });
});

describe("the Open Ocean", () => {
  const hooked = (tables: readonly number[], count = UNLOCK_THRESHOLD) =>
    tables.flatMap((table) => MULTIPLIERS.slice(0, count).map((m) => ({ table, multiplier: m, box: 2 })));
  const allTables = LAKES.map((l) => l.table);

  it("opens only once the last lake is hooked", () => {
    expect(oceanUnlocked([])).toBe(false);
    expect(oceanUnlocked(hooked(allTables.slice(0, -1)))).toBe(false); // every lake open, last not hooked
    expect(oceanUnlocked(hooked(allTables, UNLOCK_THRESHOLD - 1))).toBe(false);
    expect(oceanUnlocked(hooked(allTables))).toBe(true);
  });

  it("lands only saltwater fish in salt water, and only bass in the lakes", () => {
    const rng = seeded(21);
    const speciesOf = (id: string) => SPECIES.find((s) => s.id === id)!;
    for (let i = 0; i < 300; i++) {
      // Catch once, then look it up (catching inside find() would roll a new fish per species).
      const salt = speciesOf(catchFish(Math.floor(rng() * 9000), 5, rng, "salt").speciesId);
      const fresh = speciesOf(catchFish(Math.floor(rng() * 9000), 5, rng, "fresh").speciesId);
      expect(salt.water).toBe("salt");
      expect(fresh.water).toBe("fresh");
    }
  });

  it("saves the blue marlin for lightning-fast answers to facts he knows cold", () => {
    const tierOf = (id: string) => SPECIES.find((s) => s.id === id)!.tier;
    const rng = seeded(8);
    let marlins = 0;
    for (let i = 0; i < 3000; i++) {
      expect(tierOf(catchFish(4000, 5, rng, "salt").speciesId)).not.toBe("legendary"); // quick, but not lightning
      expect(tierOf(catchFish(800, 2, rng, "salt").speciesId)).not.toBe("legendary"); // fact not known well yet
      if (tierOf(catchFish(800, 4, rng, "salt").speciesId) === "legendary") marlins++;
    }
    expect(marlins).toBeGreaterThan(0);
  });

  it("calls a trophy by each species' own size", () => {
    expect(isTrophy("largemouth", 5 * 16)).toBe(true);
    expect(isTrophy("redfish", 10 * 16)).toBe(false); // a decent redfish, but no trophy
    expect(isTrophy("redfish", 22 * 16)).toBe(false);
    expect(isTrophy("redfish", 25 * 16)).toBe(true);
    expect(isTrophy("blue_marlin", 520 * 16)).toBe(true);
  });
});

describe("trophies", () => {
  it("are uncommon for a quick (2.5 second) answerer in the ocean", () => {
    const rng = seeded(5);
    let trophies = 0;
    for (let i = 0; i < 2000; i++) {
      const fish = catchFish(2500, 3, rng, "salt");
      if (isTrophy(fish.speciesId, fish.weightOz)) trophies++;
    }
    expect(trophies / 2000).toBeLessThan(0.3);
    expect(trophies).toBeGreaterThan(0);
  });
});

describe("gear", () => {
  it("only shows mods-only gear while someone is a mod", async () => {
    const { visibleGear } = await import("./gear");
    const decked = { avatar: "👑", boat: "pirate_ship", title: "Captain" };
    expect(visibleGear({ ...decked, isMod: true })).toMatchObject({ avatar: "👑", title: "Captain" });
    expect(visibleGear({ ...decked, isMod: true }).boat.id).toBe("pirate_ship");
    const plain = visibleGear({ ...decked, isMod: false });
    expect(plain).toMatchObject({ avatar: "🎣", title: null });
    expect(plain.boat.id).toBe("canoe");
  });
});
