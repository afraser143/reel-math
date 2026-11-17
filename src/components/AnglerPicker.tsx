"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { visibleGear } from "@/lib/domain/gear";
import { Button, Card, ModBadge } from "./ui";

interface Angler {
  id: string;
  nickname: string;
  avatar: string;
  isMod: boolean;
  boat: string;
  title: string | null;
}

export function AnglerPicker({ anglers, avatars }: { anglers: Angler[]; avatars: readonly string[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(anglers.length === 0);
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState(avatars[0]);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/profiles", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nickname, avatar }),
    });
    const body = await res.json();
    if (!res.ok) return setError(body.issues?.[0]?.message ?? body.error);
    router.push(`/anglers/${body.profile.id}`);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {anglers.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {anglers.map((a) => (
            <Link
              key={a.id}
              href={`/anglers/${a.id}`}
              className="rounded-3xl border-2 border-line bg-card p-5 text-center transition hover:-translate-y-0.5 hover:border-water"
            >
              <div className="text-5xl">{visibleGear(a).avatar}</div>
              <div className={`mt-2 truncate text-lg font-black ${a.isMod ? "text-gold" : ""}`}>{a.nickname}</div>
              {a.isMod && <ModBadge className="mt-1" />}
            </Link>
          ))}
        </div>
      )}

      {adding ? (
        <Card>
          <form onSubmit={add} className="space-y-4">
            <h2 className="text-xl font-black">New angler</h2>
            <label className="block font-bold">
              Nickname
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={24}
                required
                placeholder="Bass Master"
                className="mt-1 w-full rounded-xl border-2 border-line bg-shore px-3 py-2.5 text-lg outline-none focus:border-water"
              />
              <span className="mt-1 block text-sm font-normal text-ink-soft">A fun name is best. Please don&rsquo;t use a full real name.</span>
            </label>
            <fieldset>
              <legend className="font-bold">Pick a badge</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {avatars.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAvatar(a)}
                    aria-pressed={avatar === a}
                    className={`h-14 w-14 rounded-2xl border-2 text-3xl ${avatar === a ? "border-water bg-sky" : "border-line bg-shore"}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </fieldset>
            {error && <p className="rounded-xl bg-bobber-soft px-3 py-2 font-semibold text-bobber">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit">Add angler</Button>
              {anglers.length > 0 && (
                <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>
      ) : (
        <Button variant="ghost" onClick={() => setAdding(true)}>
          + Add another angler
        </Button>
      )}

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-ink-soft">
        <Link href="/account" className="underline">
          Grown-up settings
        </Link>
        <Link href="/privacy" className="underline">
          Privacy
        </Link>
        <button onClick={logout} className="underline">
          Sign out
        </button>
      </div>
    </div>
  );
}
