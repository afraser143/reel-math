import { Card, Shell } from "@/components/ui";
import { LAKES, lakeStatuses, MASTERED_BOX, MULTIPLIERS } from "@/lib/domain/lakes";
import { loadProgress } from "@/lib/server/fishing";
import { pageAngler } from "@/lib/server/pages";

export const metadata = { title: "Progress report · Reel Math" };

// One green ramp, darker as a fact is learned. Red is kept for misses only.
const LEVELS = [
  { label: "Not tried", cls: "bg-line/40 text-ink-soft" },
  { label: "Learning", cls: "bg-reed/15 text-ink" },
  { label: "Getting it", cls: "bg-reed/35 text-ink" },
  { label: "Solid", cls: "bg-reed/55 text-ink" },
  { label: "Mastered", cls: "bg-reed text-shore" },
] as const;

/** Missed at some point and not yet solid again. */
const needsWork = (p: { wrongCount: number; box: number }) => p.wrongCount > 0 && p.box < 3;

const level = (box: number) => LEVELS[Math.min(box, MASTERED_BOX)];

// Lakes unlock in teaching order (2, 5, 10, 3...), but a times table reads best in numeric order.
const TABLE_ROWS = [...LAKES].sort((a, b) => a.table - b.table);

export default async function ProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const { db, angler } = await pageAngler((await params).id);
  const progress = await loadProgress(db, angler.id);
  const byFact = new Map(progress.map((p) => [`${p.table}x${p.multiplier}`, p]));
  const lakes = lakeStatuses(progress, angler.unlockAll);
  const mastered = progress.filter((p) => p.box >= MASTERED_BOX).length;
  const total = LAKES.length * MULTIPLIERS.length;
  const struggling = progress
    .filter(needsWork)
    .sort((a, b) => b.wrongCount - a.wrongCount || a.box - b.box)
    .slice(0, 8);

  return (
    <Shell title="Progress report" back={{ href: `/anglers/${angler.id}`, label: "Lakes" }}>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat label="Facts mastered" value={`${mastered} / ${total}`} />
        <Stat label="Lakes open" value={`${lakes.filter((l) => l.unlocked).length} / ${lakes.length}`} />
        <Stat label="Answers given" value={String(progress.reduce((n, p) => n + p.correctCount + p.wrongCount, 0))} />
      </div>

      {struggling.length > 0 && (
        <Card className="mt-6">
          <h2 className="font-black">Needs practice</h2>
          <p className="text-sm text-ink-soft">Missed most often. These show up more in trips and tournament challenges.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {struggling.map((p) => (
              <span key={`${p.table}x${p.multiplier}`} className="rounded-xl bg-bobber-soft px-3 py-1.5 font-black text-bobber">
                {p.table} × {p.multiplier} <span className="font-semibold opacity-75">· missed {p.wrongCount}×</span>
              </span>
            ))}
          </div>
        </Card>
      )}

      <h2 className="mb-2 mt-8 text-xl font-black">Every fact</h2>
      <div className="mb-3 flex flex-wrap gap-2 text-xs font-bold">
        {LEVELS.map((l) => (
          <span key={l.label} className={`rounded-lg px-2 py-1 ${l.cls}`}>
            {l.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-ink-soft">
          <span className="h-2 w-2 rounded-full bg-bobber" /> Missed recently
        </span>
      </div>
      {/* Sized to fit all 12 columns on a phone; scrolls only as a last resort. */}
      <div className="overflow-x-auto rounded-2xl border-2 border-line bg-card p-1.5 sm:rounded-3xl sm:p-3">
        <table className="w-full table-fixed border-separate border-spacing-[2px] text-center text-[11px] sm:border-spacing-1 sm:text-sm">
          <thead>
            <tr>
              <th className="w-6 sm:w-8">
                <span className="sr-only">Table</span>
              </th>
              {MULTIPLIERS.map((m) => (
                <th key={m} className="pb-1 font-bold text-ink-soft">
                  ×{m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TABLE_ROWS.map((lake) => (
              <tr key={lake.table}>
                <th className="pr-0.5 text-right font-black sm:pr-1">{lake.table}</th>
                {MULTIPLIERS.map((m) => {
                  const p = byFact.get(`${lake.table}x${m}`);
                  const l = level(p?.box ?? 0);
                  return (
                    <td
                      key={m}
                      className={`relative h-7 rounded-md font-bold tabular-nums sm:h-9 sm:rounded-lg ${l.cls}`}
                      title={`${lake.table} × ${m}: ${l.label}${p ? ` (${p.correctCount} right, ${p.wrongCount} wrong)` : ""}`}
                    >
                      {lake.table * m}
                      {p && needsWork(p) && (
                        <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-bobber sm:h-2 sm:w-2" aria-label="missed recently" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        Facts come back on a spaced-repetition schedule: missed facts within a minute, mastered ones every two weeks.
        A fact only moves up when it&apos;s answered correctly in under 6 seconds.
      </p>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-line bg-card px-2 py-3 text-center sm:rounded-3xl sm:p-5">
      <div className="text-xl font-black tabular-nums sm:text-3xl">{value}</div>
      <div className="text-xs font-bold leading-tight text-ink-soft sm:text-sm">{label}</div>
    </div>
  );
}
