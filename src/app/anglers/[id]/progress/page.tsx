import { Card, Shell } from "@/components/ui";
import { LAKES, lakeStatuses, MASTERED_BOX, MULTIPLIERS } from "@/lib/domain/lakes";
import { loadProgress } from "@/lib/server/fishing";
import { pageAngler } from "@/lib/server/pages";

export const metadata = { title: "Progress report · Reel Math" };

const LEVELS = [
  { label: "Not tried", cls: "bg-line/40 text-ink-soft" },
  { label: "Learning", cls: "bg-bobber-soft text-bobber" },
  { label: "Getting it", cls: "bg-gold-soft text-gold" },
  { label: "Solid", cls: "bg-sky text-water" },
  { label: "Mastered", cls: "bg-reed-soft text-reed" },
] as const;

const level = (box: number) => LEVELS[Math.min(box, MASTERED_BOX)];

export default async function ProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const { db, angler } = await pageAngler((await params).id);
  const progress = await loadProgress(db, angler.id);
  const byFact = new Map(progress.map((p) => [`${p.table}x${p.multiplier}`, p]));
  const lakes = lakeStatuses(progress);
  const mastered = progress.filter((p) => p.box >= MASTERED_BOX).length;
  const total = LAKES.length * MULTIPLIERS.length;
  const struggling = progress
    .filter((p) => p.wrongCount > 0 && p.box < 3)
    .sort((a, b) => b.wrongCount - a.wrongCount || a.box - b.box)
    .slice(0, 8);

  return (
    <Shell title="Progress report" back={{ href: `/anglers/${angler.id}`, label: "Lakes" }}>
      <div className="grid gap-3 sm:grid-cols-3">
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
      </div>
      <div className="overflow-x-auto rounded-3xl border-2 border-line bg-card p-3">
        <table className="w-full border-separate border-spacing-1 text-center text-sm">
          <thead>
            <tr>
              <th className="sr-only">Table</th>
              {MULTIPLIERS.map((m) => (
                <th key={m} className="font-bold text-ink-soft">
                  ×{m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LAKES.map((lake) => (
              <tr key={lake.table}>
                <th className="pr-1 text-right font-black">{lake.table}</th>
                {MULTIPLIERS.map((m) => {
                  const p = byFact.get(`${lake.table}x${m}`);
                  const l = level(p?.box ?? 0);
                  return (
                    <td
                      key={m}
                      className={`h-9 min-w-9 rounded-lg font-bold ${l.cls}`}
                      title={`${lake.table} × ${m}: ${l.label}${p ? ` (${p.correctCount} right, ${p.wrongCount} wrong)` : ""}`}
                    >
                      {lake.table * m}
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
    <Card className="text-center">
      <div className="text-3xl font-black">{value}</div>
      <div className="text-sm font-bold text-ink-soft">{label}</div>
    </Card>
  );
}
