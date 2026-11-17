import Link from "next/link";
import { Card, LinkButton, ModBadge, ProgressBar, Shell } from "@/components/ui";
import { formatWeight } from "@/lib/domain/fish";
import { visibleGear } from "@/lib/domain/gear";
import { OCEAN, UNLOCK_THRESHOLD } from "@/lib/domain/lakes";
import { getLakes, getLivewell } from "@/lib/server/fishing";
import { pageAngler } from "@/lib/server/pages";

export const metadata = { title: "Lake map · Reel Math" };

export default async function LakeMap({ params }: { params: Promise<{ id: string }> }) {
  const { db, angler } = await pageAngler((await params).id);
  const [lakes, livewell] = await Promise.all([getLakes(db, angler.id), getLivewell(db, angler.id)]);
  const totalFish = livewell.bySpecies.reduce((n, s) => n + s.count, 0);
  const biggest = Math.max(0, ...livewell.bySpecies.map((s) => s.bestOz ?? 0));
  const base = `/anglers/${angler.id}`;
  const lastLake = lakes[lakes.length - 1];
  const oceanOpen = angler.unlockAll || (lastLake.unlocked && lastLake.hooked >= UNLOCK_THRESHOLD);
  const gear = visibleGear(angler);

  return (
    <Shell
      title={`${gear.avatar} ${angler.nickname}`}
      back={{ href: "/anglers", label: "Anglers" }}
      right={
        <Link href={`${base}/livewell`} className="rounded-xl bg-white/15 px-3 py-1.5 text-sm font-bold hover:bg-white/25">
          🪣 {totalFish}
        </Link>
      }
    >
      <div className="mb-4 flex items-center gap-3 rounded-3xl border-2 border-line bg-card px-4 py-3">
        <span className="text-4xl" aria-hidden>
          {gear.boat.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`truncate text-lg font-black ${angler.isMod ? "text-gold" : ""}`}>{angler.nickname}</span>
            {angler.isMod && <ModBadge />}
          </div>
          <div className="text-sm text-ink-soft">
            {gear.title ? `${gear.title} · ` : ""}
            {gear.boat.name}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <LinkButton href={`${base}/trophies`} variant="ghost" className="px-3 py-2 text-base">
            🏆 Trophies
          </LinkButton>
          <LinkButton href={`${base}/gear`} variant="ghost" className="px-3 py-2 text-base">
            🎒 Gear
          </LinkButton>
        </div>
      </div>

      {angler.unlockAll && (
        <p className="mb-4 rounded-2xl bg-sky px-4 py-2.5 text-center text-sm font-bold text-ink">
          🔓 A grown-up opened every lake and the Open Ocean for you.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <LinkButton href={`${base}/cast`} className="py-5 text-xl">
          🎣 Cast a line
        </LinkButton>
        <LinkButton href={`${base}/tournament`} variant="water" className="py-5 text-xl">
          🏆 Tournament challenge
        </LinkButton>
      </div>
      <p className="mt-3 text-center text-sm text-ink-soft">
        {totalFish > 0
          ? `${totalFish} fish landed so far. Biggest: ${formatWeight(biggest)}.`
          : "Cast a line to catch your first bass!"}
      </p>

      <h2 className="mb-3 mt-8 text-xl font-black">Lakes</h2>
      <ol className="grid gap-3 sm:grid-cols-2">
        {lakes.map((lake) => {
          const done = lake.mastered === lake.total;
          const inner = (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-wide text-ink-soft">{lake.table}s</div>
                  <div className="truncate text-lg font-black">{lake.name}</div>
                </div>
                <span className="relative text-3xl leading-none" aria-hidden>
                  <span className={lake.unlocked ? "" : "opacity-40 grayscale"}>{lake.emoji}</span>
                  {(!lake.unlocked || done) && (
                    <span className="absolute -bottom-1 -right-2 text-base">{lake.unlocked ? "🏆" : "🔒"}</span>
                  )}
                </span>
              </div>
              {lake.unlocked ? (
                <>
                  <p className="mt-1 text-sm text-ink-soft">{lake.blurb}</p>
                  <div className="mt-3 space-y-1.5">
                    <ProgressBar value={lake.hooked} max={lake.total} color="bg-water" />
                    <ProgressBar value={lake.mastered} max={lake.total} color="bg-gold" />
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-ink-soft">
                    {lake.hooked}/{lake.total} hooked · {lake.mastered}/{lake.total} mastered
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-ink-soft">Hook {UNLOCK_THRESHOLD} facts in the lake before this one to open it.</p>
              )}
            </>
          );
          return (
            <li key={lake.table}>
              {lake.unlocked ? (
                <Link
                  href={`${base}/cast?lake=${lake.table}`}
                  className="block rounded-3xl border-2 border-line bg-card p-4 transition hover:-translate-y-0.5 hover:border-water"
                >
                  {inner}
                </Link>
              ) : (
                <div className="rounded-3xl border-2 border-dashed border-line p-4 opacity-70">{inner}</div>
              )}
            </li>
          );
        })}
      </ol>

      {oceanOpen ? (
        <Link
          href={`${base}/cast?water=salt`}
          className="mt-4 block overflow-hidden rounded-3xl bg-gradient-to-br from-ocean to-ocean-deep p-5 text-white shadow-[0_4px_0_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5"
        >
          <div className="text-xs font-bold uppercase tracking-wide text-white/70">Saltwater · every table</div>
          <div className="mt-1 text-2xl font-black">🌊 {OCEAN.name}</div>
          <p className="mt-1 text-white/85">{OCEAN.blurb} Tarpon, sailfish, and maybe a blue marlin.</p>
        </Link>
      ) : (
        <div className="mt-4 rounded-3xl border-2 border-dashed border-line p-5 opacity-80">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-ink-soft">Saltwater</div>
              <div className="text-lg font-black">{OCEAN.name}</div>
            </div>
            <span className="text-2xl" aria-hidden>
              🔒
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Beyond the last lake lies the sea. Hook {UNLOCK_THRESHOLD} facts in {lastLake.name} to reach it
            {lastLake.unlocked ? ` (${lastLake.hooked}/${UNLOCK_THRESHOLD} so far)` : ""}.
          </p>
        </div>
      )}

      <Card className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-black">For grown-ups</div>
          <div className="text-sm text-ink-soft">Every fact, how well it&apos;s known, and which ones need work.</div>
        </div>
        <LinkButton href={`${base}/progress`} variant="ghost">
          Progress report
        </LinkButton>
      </Card>
    </Shell>
  );
}
