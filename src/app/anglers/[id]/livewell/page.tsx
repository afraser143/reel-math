import { Fish } from "@/components/Fish";
import { Card, Shell } from "@/components/ui";
import { formatWeight, SPECIES, type Species } from "@/lib/domain/fish";
import { oceanUnlocked } from "@/lib/domain/lakes";
import { getLivewell, loadProgress } from "@/lib/server/fishing";
import { pageAngler } from "@/lib/server/pages";

export const metadata = { title: "Livewell · Reel Math" };

type SpeciesStats = Awaited<ReturnType<typeof getLivewell>>["bySpecies"][number];

const TIER_HINT = {
  common: "Not caught yet.",
  rare: "Only bites on lightning-fast answers.",
  legendary: "Bites on quick answers to facts you know well. Keep trying: it always shows up in the end!",
};

export default async function LivewellPage({ params }: { params: Promise<{ id: string }> }) {
  const { db, angler } = await pageAngler((await params).id);
  const [{ recent, bySpecies }, progress] = await Promise.all([getLivewell(db, angler.id), loadProgress(db, angler.id)]);
  const stats = new Map(bySpecies.map((s) => [s.speciesId, s]));
  const name = (id: string) => SPECIES.find((s) => s.id === id)?.name ?? id;
  const ocean = oceanUnlocked(progress, angler.unlockAll) || SPECIES.some((s) => s.water === "salt" && stats.has(s.id));

  return (
    <Shell title="🪣 Livewell" back={{ href: `/anglers/${angler.id}`, label: "Lakes" }}>
      <SpeciesLog title="Lakes" species={SPECIES.filter((s) => s.water === "fresh")} stats={stats} />

      {ocean ? (
        <SpeciesLog title="Open Ocean" species={SPECIES.filter((s) => s.water === "salt")} stats={stats} />
      ) : (
        <p className="mt-6 rounded-3xl border-2 border-dashed border-line p-4 text-ink-soft">
          🌊 Saltwater species will show up here once you reach the Open Ocean.
        </p>
      )}

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

function SpeciesLog({ title, species, stats }: { title: string; species: Species[]; stats: Map<string, SpeciesStats> }) {
  return (
    <>
      <h2 className="mb-3 mt-6 text-xl font-black first:mt-0">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {species.map((s) => {
          const st = stats.get(s.id);
          return (
            <Card key={s.id} className={`flex items-center gap-4 ${st ? "" : "opacity-60"}`}>
              <Fish speciesId={s.id} className={`h-14 w-24 shrink-0 ${st ? "" : "brightness-50 grayscale"}`} />
              <div className="min-w-0">
                <div className="font-black">
                  {st ? s.name : "???"}{" "}
                  {s.tier !== "common" && (
                    <span className={`text-xs ${s.tier === "legendary" ? "text-gold" : "text-bobber"}`}>{s.tier.toUpperCase()}</span>
                  )}
                </div>
                <div className="text-sm text-ink-soft">
                  {st ? `${st.count} caught · best ${formatWeight(st.bestOz ?? 0)}` : TIER_HINT[s.tier]}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
