import { Card, Shell } from "@/components/ui";
import { ACHIEVEMENTS } from "@/lib/domain/achievements";
import { getAchievements } from "@/lib/server/fishing";
import { pageAngler } from "@/lib/server/pages";

export const metadata = { title: "Trophy wall · Reel Math" };

export default async function TrophiesPage({ params }: { params: Promise<{ id: string }> }) {
  const { db, angler } = await pageAngler((await params).id);
  const earned = new Map((await getAchievements(db, angler.id)).map((a) => [a.id, a.earnedAt]));

  return (
    <Shell title="🏆 Trophy wall" back={{ href: `/anglers/${angler.id}`, label: "Lakes" }}>
      <p className="mb-4 text-center text-lg font-black">
        {earned.size} of {ACHIEVEMENTS.length} trophies
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ACHIEVEMENTS.map((a) => {
          const when = earned.get(a.id);
          return (
            <Card
              key={a.id}
              className={`text-center ${when ? "border-gold bg-gold-soft" : "border-dashed opacity-70"}`}
            >
              <div className={`text-5xl ${when ? "" : "grayscale"}`} aria-hidden>
                {when ? a.emoji : "❔"}
              </div>
              <div className="mt-2 font-black leading-tight">{a.name}</div>
              <div className="mt-1 text-sm text-ink-soft">
                {when
                  ? `Earned ${when.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                  : a.hint}
              </div>
            </Card>
          );
        })}
      </div>
    </Shell>
  );
}
