import { FishingTrip } from "@/components/FishingTrip";
import { Shell } from "@/components/ui";
import { getLake } from "@/lib/domain/lakes";
import { pageAngler } from "@/lib/server/pages";

export const metadata = { title: "Cast a line · Reel Math" };

export default async function CastPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lake?: string }>;
}) {
  const { angler } = await pageAngler((await params).id);
  const lake = getLake(Number((await searchParams).lake));
  return (
    <Shell title={lake ? lake.name : "Mixed bag"} back={{ href: `/anglers/${angler.id}`, label: "Lakes" }}>
      <FishingTrip profileId={angler.id} mode="card" lake={lake?.table} />
    </Shell>
  );
}
