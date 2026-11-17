import { GearPicker } from "@/components/GearPicker";
import { Shell } from "@/components/ui";
import { pageAngler } from "@/lib/server/pages";

export const metadata = { title: "Gear · Reel Math" };

export default async function GearPage({ params }: { params: Promise<{ id: string }> }) {
  const { angler } = await pageAngler((await params).id);
  return (
    <Shell title="🎒 Gear" back={{ href: `/anglers/${angler.id}`, label: "Lakes" }}>
      <GearPicker angler={angler} />
    </Shell>
  );
}
