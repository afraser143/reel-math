"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatWeight, speedScore, type Water } from "@/lib/domain/fish";
import type { AnswerResult } from "@/lib/server/fishing";
import { isMuted, playFanfare, playFishOn, playMiss, playReel, playSplash, setMuted } from "@/lib/sounds";
import { Confetti } from "./Celebrate";
import { LegendaryCelebration } from "./Fireworks";
import { Bobber, Fish } from "./Fish";
import { NumberPad } from "./NumberPad";
import { Button, Card, LinkButton, ProgressBar } from "./ui";

interface Item {
  table: number;
  multiplier: number;
  story?: string;
  /** Missed facts come back once at the end of the trip. */
  retry?: boolean;
}

type Phase =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "asking" }
  | { kind: "result"; result: AnswerResult }
  | { kind: "done" };

export function FishingTrip({
  profileId,
  mode,
  lake,
  water = "fresh",
  boat,
}: {
  profileId: string;
  mode: "card" | "word";
  lake?: number;
  water?: Water;
  /** The angler's boat, shown heading out and back at the dock. */
  boat?: { emoji: string; name: string };
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [landed, setLanded] = useState<NonNullable<AnswerResult["fish"]>[]>([]);
  const [tripKey, setTripKey] = useState(0);
  const [muted, setMutedState] = useState(false);
  useEffect(() => setMutedState(isMuted()), []);
  const askedAt = useRef(0);

  const lakeMap = `/anglers/${profileId}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPhase({ kind: "loading" });
      const url = mode === "word" ? `/api/profiles/${profileId}/word-problems` : `/api/profiles/${profileId}/trips`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(mode === "card" ? (water === "salt" ? { water } : { focusTable: lake }) : {}),
      });
      const body = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (!res.ok) return setPhase({ kind: "error", message: body.error ?? "Couldn't launch the boat." });
      const next: Item[] = mode === "word" ? body.problems : body.cards;
      setItems(next);
      setIndex(0);
      setLanded([]);
      setInput("");
      setPhase(next.length ? { kind: "asking" } : { kind: "done" });
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId, mode, lake, water, tripKey]);

  // Start the clock whenever a new question appears.
  useEffect(() => {
    if (phase.kind === "asking") askedAt.current = performance.now();
  }, [phase.kind, index]);

  const item = items[index];

  const submit = useCallback(async () => {
    if (!item || !input || sending) return;
    setSending(true);
    playReel();
    const responseMs = Math.round(performance.now() - askedAt.current);
    const res = await fetch(`/api/profiles/${profileId}/answers`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        table: item.table,
        multiplier: item.multiplier,
        answer: Number(input),
        responseMs,
        mode,
        water,
      }),
    });
    setSending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return setPhase({ kind: "error", message: body.error ?? "The line got tangled. Try again." });
    }
    const result: AnswerResult = await res.json();
    if (result.fish) {
      playSplash();
      // A legendary catch gets its own fireworks show, which plays its own sound.
      if (result.fish.tier !== "legendary") {
        if (isBigMoment(result)) playFanfare();
        else playFishOn();
      }
    } else {
      playMiss();
    }
    if (result.fish) setLanded((l) => [...l, result.fish!]);
    if (!result.correct && !item.retry) setItems((list) => [...list, { ...item, retry: true }]);
    setPhase({ kind: "result", result });
  }, [item, input, sending, profileId, mode, water]);

  const next = useCallback(() => {
    setInput("");
    if (index + 1 >= items.length) return setPhase({ kind: "done" });
    setIndex(index + 1);
    setPhase({ kind: "asking" });
  }, [index, items.length]);

  // Enter moves on from the result screen too.
  useEffect(() => {
    if (phase.kind !== "result") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase.kind, next]);

  if (phase.kind === "loading") {
    return (
      <div className="py-16 text-center">
        {boat ? (
          <div className="animate-bob text-6xl" aria-hidden>
            {boat.emoji}
          </div>
        ) : (
          <Bobber className="animate-bob mx-auto h-20 w-14 text-ink" />
        )}
        <p className="mt-4 text-lg font-bold text-ink-soft">
          {mode === "word"
            ? "The tournament director is writing your challenges…"
            : water === "salt"
              ? `Heading out past the breakers${boat ? ` in your ${boat.name}` : ""}…`
              : boat
                ? `Heading out in your ${boat.name}…`
                : "Baiting the hook…"}
        </p>
      </div>
    );
  }

  if (phase.kind === "error") {
    return (
      <Card className="text-center">
        <p className="text-lg font-bold">{phase.message}</p>
        <LinkButton href={lakeMap} variant="ghost" className="mt-4">
          Back to the lakes
        </LinkButton>
      </Card>
    );
  }

  if (phase.kind === "done") {
    return <TripSummary landed={landed} onAgain={() => setTripKey((k) => k + 1)} lakeMap={lakeMap} boat={boat} />;
  }

  const answered = phase.kind === "result" ? index + 1 : index;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <ProgressBar value={answered} max={items.length} color="bg-water" />
        <span className="shrink-0 text-sm font-bold text-ink-soft">
          {Math.min(index + 1, items.length)}/{items.length}
        </span>
        <button
          type="button"
          onClick={() => {
            setMuted(!muted);
            setMutedState(!muted);
          }}
          aria-label={muted ? "Turn sound on" : "Turn sound off"}
          aria-pressed={!muted}
          className="shrink-0 rounded-full border-2 border-line bg-card px-2.5 py-1 text-lg leading-none"
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      {phase.kind === "asking" && (
        <>
          <Card className="text-center">
            {item.retry && <p className="mb-1 text-sm font-bold text-water">Second cast at this one!</p>}
            {item.story ? (
              <p className="text-left text-xl font-semibold leading-relaxed sm:text-2xl">{item.story}</p>
            ) : (
              <p className="text-6xl font-black tracking-tight sm:text-7xl">
                {item.table} × {item.multiplier}
              </p>
            )}
            <div className="mx-auto mt-4 flex h-16 max-w-[12rem] items-center justify-center rounded-2xl border-2 border-dashed border-water bg-sky text-5xl font-black text-ink">
              {input || <span className="text-ink-soft/40">?</span>}
            </div>
            {mode === "card" && <BiteMeter key={index} />}
          </Card>
          <NumberPad value={input} onChange={setInput} onSubmit={submit} disabled={sending} />
        </>
      )}

      {phase.kind === "result" && (
        <ResultCard result={phase.result} item={item} onNext={next} last={index + 1 >= items.length} />
      )}
    </div>
  );
}

/** Drains over 10 seconds: the fuller it is when you answer, the bigger the fish. */
function BiteMeter() {
  const [score, setScore] = useState(1);
  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => setScore(speedScore(performance.now() - start)), 100);
    return () => clearInterval(id);
  }, []);
  const label = score > 0.75 ? "Lunker zone!" : score > 0.4 ? "Good bite" : score > 0 ? "Nibble" : "Still biting…";
  return (
    <div className="mx-auto mt-4 max-w-xs">
      <div className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wide text-ink-soft">
        <span>Bite meter</span>
        <span>{label}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-line/60">
        <div className="h-full rounded-full bg-gradient-to-r from-reed to-gold" style={{ width: `${Math.max(score, 0.04) * 100}%` }} />
      </div>
    </div>
  );
}

function ResultCard({ result, item, onNext, last }: { result: AnswerResult; item: Item; onNext: () => void; last: boolean }) {
  const fish = result.fish;
  // The legendary show plays over the result card; closing it reveals the card as usual.
  const [showLegend, setShowLegend] = useState(fish?.tier === "legendary");
  return (
    <Card className={`animate-splash text-center ${result.correct ? "" : "border-bobber"}`}>
      {fish ? (
        <>
          <p className="text-sm font-black uppercase tracking-widest text-reed">Fish on!</p>
          <div className={isBigMoment(result) ? "animate-leap" : ""}>
            <Fish speciesId={fish.speciesId} weightOz={fish.weightOz} className="mx-auto my-2 h-32 w-56" />
          </div>
          <p className="text-2xl font-black">
            {formatWeight(fish.weightOz)} {fish.speciesName}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {fish.lunker && (
              <Badge className="bg-gold-soft text-gold">{fish.water === "salt" ? "🏆 Trophy fish!" : "🏆 Lunker!"}</Badge>
            )}
            {fish.personalBest && <Badge className="bg-reed-soft text-reed">⭐ Biggest {fish.speciesName} yet!</Badge>}
            {fish.tier === "rare" && <Badge className="bg-bobber-soft text-bobber">✨ Rare catch!</Badge>}
            {fish.tier === "legendary" && <Badge className="bg-gold-soft text-gold">🌟 Legendary catch!</Badge>}
          </div>
          <p className="mt-3 text-lg font-bold text-ink-soft">
            {item.table} × {item.multiplier} = {result.correctAnswer}
          </p>
        </>
      ) : (
        <>
          <p className="animate-wiggle text-5xl" aria-hidden>
            🪝
          </p>
          <p className="mt-2 text-2xl font-black text-bobber">The line snapped!</p>
          <p className="mt-2 text-4xl font-black">
            {item.table} × {item.multiplier} = {result.correctAnswer}
          </p>
          {result.tip && (
            <p className="mx-auto mt-4 max-w-md rounded-2xl bg-sky px-4 py-3 text-left font-semibold text-ink">
              <span className="font-black">Guide tip: </span>
              {result.tip}
            </p>
          )}
          {!item.retry && <p className="mt-2 text-sm text-ink-soft">You&apos;ll get another cast at this one.</p>}
        </>
      )}
      {result.unlockedLake && (
        <p className="mt-4 rounded-2xl bg-gold-soft px-4 py-3 font-black text-gold">
          🗺️ New lake unlocked: {result.unlockedLake.name}!
        </p>
      )}
      {result.unlockedOcean && (
        <p className="mt-4 rounded-2xl bg-ocean px-4 py-3 font-black text-white">
          🌊 You reached the Open Ocean! Saltwater fish are biting.
        </p>
      )}
      {fish?.fact && (
        <div className="mx-auto mt-4 max-w-md rounded-2xl border-2 border-water/40 bg-sky px-4 py-3 text-left">
          <p className="text-xs font-black uppercase tracking-widest text-water">🐟 New species! Fish fact</p>
          <p className="mt-1 font-semibold text-ink">{fish.fact}</p>
        </div>
      )}
      {result.achievements?.map((a) => (
        <div key={a.id} className="animate-splash mt-4 rounded-2xl bg-gold-soft px-4 py-3">
          <p className="text-xs font-black uppercase tracking-widest text-gold">🏆 Trophy wall</p>
          <p className="mt-0.5 text-xl font-black text-ink">
            {a.emoji} {a.name}
          </p>
          <p className="text-sm text-ink-soft">{a.hint}</p>
        </div>
      ))}
      {isBigMoment(result) && !showLegend && <Confetti pieces={result.achievements?.length ? 80 : 40} />}
      {showLegend && fish && (
        <LegendaryCelebration
          speciesId={fish.speciesId}
          speciesName={fish.speciesName}
          weightOz={fish.weightOz}
          onClose={() => setShowLegend(false)}
        />
      )}
      <Button onClick={onNext} className="mt-5 w-full max-w-xs" autoFocus>
        {last ? "Head to the dock" : "Next cast"}
      </Button>
    </Card>
  );
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`rounded-full px-3 py-1 text-sm font-black ${className}`}>{children}</span>;
}

function TripSummary({
  landed,
  onAgain,
  lakeMap,
  boat,
}: {
  landed: NonNullable<AnswerResult["fish"]>[];
  onAgain: () => void;
  lakeMap: string;
  boat?: { emoji: string; name: string };
}) {
  const total = landed.reduce((n, f) => n + f.weightOz, 0);
  const biggest = landed.reduce<(typeof landed)[number] | null>((b, f) => (!b || f.weightOz > b.weightOz ? f : b), null);
  return (
    <Card className="animate-splash text-center">
      <p className="text-sm font-black uppercase tracking-widest text-water">
        {boat ? `${boat.emoji} ` : ""}Back at the dock
      </p>
      <h2 className="mt-1 text-3xl font-black">
        {landed.length} {landed.some((f) => f.water === "salt") ? "fish" : "bass"} landed
      </h2>
      {biggest ? (
        <>
          <Fish speciesId={biggest.speciesId} weightOz={biggest.weightOz} className="mx-auto my-3 h-32 w-56" />
          <p className="text-lg font-bold">
            Biggest: {formatWeight(biggest.weightOz)} {biggest.speciesName}
          </p>
          <p className="text-ink-soft">Total weigh-in: {formatWeight(total)}</p>
        </>
      ) : (
        <p className="mt-3 text-ink-soft">Tough day on the water. Every pro has them. Let&apos;s try again!</p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={onAgain}>Fish again</Button>
        <LinkButton href={lakeMap} variant="ghost">
          Lake map
        </LinkButton>
      </div>
    </Card>
  );
}

/** Lunkers, rare and legendary fish, and new achievements get confetti and a fanfare. */
function isBigMoment(result: AnswerResult): boolean {
  const fish = result.fish;
  return Boolean(result.achievements?.length || (fish && (fish.lunker || fish.tier !== "common")));
}
