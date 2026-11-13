import { FishingTrip } from "@/components/FishingTrip";
import { Shell } from "@/components/ui";
import { pageAngler } from "@/lib/server/pages";

export const metadata = { title: "Tournament challenge · Reel Math" };

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { angler } = await pageAngler((await params).id);
  return (
    <Shell title="Tournament challenge" back={{ href: `/anglers/${angler.id}`, label: "Lakes" }}>
      <FishingTrip profileId={angler.id} mode="word" />
    </Shell>
  );
}
