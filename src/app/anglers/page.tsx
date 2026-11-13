import { AnglerPicker } from "@/components/AnglerPicker";
import { Shell } from "@/components/ui";
import { getDb } from "@/db";
import { AVATARS, listProfiles } from "@/lib/server/fishing";
import { pageUser } from "@/lib/server/pages";

export const metadata = { title: "Who's fishing? · Reel Math" };

export default async function AnglersPage() {
  const user = await pageUser();
  const anglers = await listProfiles(await getDb(), user.id);
  return (
    <Shell title="Who's fishing today?">
      <AnglerPicker anglers={anglers} avatars={AVATARS} />
    </Shell>
  );
}
