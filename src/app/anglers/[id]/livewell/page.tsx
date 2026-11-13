import { Fish } from "@/components/Fish";
import { Card, Shell } from "@/components/ui";
import { formatWeight, SPECIES } from "@/lib/domain/fish";
import { getLivewell } from "@/lib/server/fishing";
import { pageAngler } from "@/lib/server/pages";

export const metadata = { title: "Livewell · Reel Math" };

export default async function LivewellPage({ params }: { params: Promise<{ id: string }> }) {
  const { db, angler } = await pageAngler((await params).id);
  const { recent, bySpecies } = await getLivewell(db, angler.id);
  const stats = new Map(bySpecies.map((s) => [s.speciesId, s]));
  const name = (id: string) => SPECIES.find((s) => s.id === id)?.name ?? id;

  return (
    <Shell title="🪣 Livewell" back={{ href: `/anglers/${angler.id}`, label: "Lakes" }}>
      <h2 className="mb-3 text-xl font-black">Species log</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {SPECIES.map((s) => {
          const st = stats.get(s.id);
          return (
            <Card key={s.id} className={`flex items-center gap-4 ${st ? "" : "opacity-60"}`}>
              <Fish speciesId={s.id} className={`h-14 w-24 shrink-0 ${st ? "" : "grayscale brightness-50"}`} />
              <div className="min-w-0">
                <div className="font-black">
                  {st ? s.name : "???"} {s.rare && <span className="text-xs text-bobber">RARE</span>}
                </div>
                {st ? (
                  <div className="text-sm text-ink-soft">
                    {st.count} caught · best {formatWeight(st.bestOz ?? 0)}
                  </div>
                ) : (
                  <div className="text-sm text-ink-soft">{s.rare ? "Only bites on lightning-fast answers." : "Not caught yet."}</div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <h2 className="mb-3 mt-8 text-xl font-black">Recent catches</h2>
      {recent.length === 0 ? (
        <p className="text-ink-soft">Nothing in the livewell yet. Go cast a line!</p>
      ) : (
        <Card className="divide-y-2 divide-line p-0">
          {recent.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
              <Fish speciesId={c.speciesId} className="h-7 w-12 shrink-0" />
              <div className="min-w-0 flex-1 truncate font-bold">
                {formatWeight(c.weightOz)} {name(c.speciesId)}
              </div>
              <div className="shrink-0 text-sm text-ink-soft">
                {c.table} × {c.multiplier}
              </div>
            </div>
          ))}
        </Card>
      )}
    </Shell>
  );
}
