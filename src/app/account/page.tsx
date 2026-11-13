import Link from "next/link";
import { AccountSettings } from "@/components/AccountSettings";
import { Shell } from "@/components/ui";
import { getDb } from "@/db";
import { listProfiles } from "@/lib/server/fishing";
import { pageUser } from "@/lib/server/pages";

export const metadata = { title: "Grown-up settings · Reel Math" };

export default async function AccountPage() {
  const user = await pageUser();
  const anglers = await listProfiles(await getDb(), user.id);
  return (
    <Shell title="Grown-up settings" back={{ href: "/anglers", label: "Anglers" }}>
      <AccountSettings email={user.email} anglers={anglers} />
      <p className="mt-6 text-sm text-ink-soft">
        See what Reel Math stores and why in the{" "}
        <Link href="/privacy" className="font-bold text-water underline">
          privacy policy
        </Link>
        .
      </p>
    </Shell>
  );
}
