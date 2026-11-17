"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BOATS, MOD_BADGES, STANDARD_BADGES, TITLES } from "@/lib/domain/gear";
import { Card } from "./ui";

interface Angler {
  id: string;
  nickname: string;
  avatar: string;
  isMod: boolean;
  boat: string;
  title: string | null;
}

/** Badge, boat and title. Mods-only options are shown to everyone, locked unless you're a mod. */
export function GearPicker({ angler }: { angler: Angler }) {
  const router = useRouter();
  const [gear, setGear] = useState({ avatar: angler.avatar, boat: angler.boat, title: angler.title });
  const [error, setError] = useState<string | null>(null);

  async function save(change: Partial<typeof gear>) {
    const before = gear;
    setGear({ ...gear, ...change });
    setError(null);
    const res = await fetch(`/api/profiles/${angler.id}/gear`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(change),
    });
    if (!res.ok) {
      setGear(before);
      const body = await res.json().catch(() => ({}));
      return setError(body.error ?? "Couldn't save that. Try again.");
    }
    router.refresh();
  }

  const tile = (selected: boolean, locked: boolean) =>
    `relative flex flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2 font-bold transition ${
      selected ? "border-water bg-sky" : "border-line bg-card"
    } ${locked ? "cursor-not-allowed opacity-45" : "hover:border-water"}`;

  return (
    <div className="space-y-6">
      {!angler.isMod && (
        <p className="rounded-2xl bg-gold-soft px-4 py-3 font-bold text-gold">
          🛡️ Gear marked MOD is for mods. A grown-up can make you a mod in Grown-up settings.
        </p>
      )}

      <Card>
        <h2 className="text-lg font-black">Badge</h2>
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-7">
          {[...STANDARD_BADGES, ...MOD_BADGES].map((b) => {
            const locked = (MOD_BADGES as readonly string[]).includes(b) && !angler.isMod;
            return (
              <button
                key={b}
                type="button"
                disabled={locked}
                aria-pressed={gear.avatar === b}
                onClick={() => save({ avatar: b })}
                className={`${tile(gear.avatar === b, locked)} h-16 text-3xl`}
              >
                {b}
                {(MOD_BADGES as readonly string[]).includes(b) && <ModTag />}
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-black">Boat</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BOATS.map((boat) => {
            const locked = boat.modOnly && !angler.isMod;
            return (
              <button
                key={boat.id}
                type="button"
                disabled={locked}
                aria-pressed={gear.boat === boat.id}
                onClick={() => save({ boat: boat.id })}
                className={`${tile(gear.boat === boat.id, locked)} py-3`}
              >
                <span className="text-4xl">{boat.emoji}</span>
                <span>{boat.name}</span>
                {boat.modOnly && <ModTag />}
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-black">
          Title <span className="text-sm text-gold">MODS ONLY</span>
        </h2>
        <p className="text-sm text-ink-soft">Shown under your name on your lake map.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TITLES.map((t) => (
            <button
              key={t}
              type="button"
              disabled={!angler.isMod}
              aria-pressed={gear.title === t}
              onClick={() => save({ title: gear.title === t ? null : t })}
              className={`rounded-full border-2 px-4 py-2 font-bold ${
                gear.title === t ? "border-gold bg-gold-soft text-gold" : "border-line bg-card"
              } ${angler.isMod ? "hover:border-gold" : "cursor-not-allowed opacity-45"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </Card>

      {error && <p className="rounded-xl bg-bobber-soft px-3 py-2 font-semibold text-bobber">{error}</p>}
    </div>
  );
}

function ModTag() {
  return (
    <span className="absolute -right-1 -top-2 rounded-full bg-gold px-1.5 text-[10px] font-black leading-4 text-white">
      MOD
    </span>
  );
}
