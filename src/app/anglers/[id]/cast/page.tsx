import { FishingTrip } from "@/components/FishingTrip";
import { Shell } from "@/components/ui";
import { getLake, OCEAN } from "@/lib/domain/lakes";
import { pageAngler } from "@/lib/server/pages";

export const metadata = { title: "Cast a line · Reel Math" };

export default async function CastPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lake?: string; water?: string }>;
}) {
  const { angler } = await pageAngler((await params).id);
  const query = await searchParams;
  const back = { href: `/anglers/${angler.id}`, label: "Lakes" };
  if (query.water === "salt") {
    return (
      <Shell title={`🌊 ${OCEAN.name}`} back={back} theme="ocean">
        <FishingTrip profileId={angler.id} mode="card" water="salt" />
      </Shell>
    );
  }
  const lake = getLake(Number(query.lake));
  return (
    <Shell title={lake ? lake.name : "Mixed bag"} back={back}>
      <FishingTrip profileId={angler.id} mode="card" lake={lake?.table} />
    </Shell>
  );
}
