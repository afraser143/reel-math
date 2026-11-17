"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, ModBadge } from "./ui";

interface Angler {
  id: string;
  nickname: string;
  avatar: string;
  isMod: boolean;
}

export function AccountSettings({ email, anglers }: { email: string; anglers: Angler[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [modFor, setModFor] = useState<Angler | null>(null);
  const [modPassword, setModPassword] = useState("");

  async function changeMod(e: React.FormEvent) {
    e.preventDefault();
    if (!modFor) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/profiles/${modFor.id}/mod`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ enabled: !modFor.isMod, password: modPassword }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return setError(body.issues?.[0]?.message ?? body.error ?? "Something went wrong");
    }
    setModFor(null);
    setModPassword("");
    router.refresh();
  }

  async function removeAngler(a: Angler) {
    if (!window.confirm(`Delete ${a.nickname} and all of their progress and catches? This can't be undone.`)) return;
    setBusy(true);
    const res = await fetch(`/api/profiles/${a.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return setError("Couldn't delete that angler. Try again.");
    router.refresh();
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!window.confirm("Delete your account and everything in it? This can't be undone.")) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return setError(body.issues?.[0]?.message ?? body.error ?? "Something went wrong");
    }
    router.push("/?deleted=1");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-black">Account</h2>
        <p className="mt-1 text-ink-soft">
          Signed in as <span className="font-bold text-ink">{email}</span>
        </p>
      </Card>

      <Card>
        <h2 className="text-lg font-black">Anglers</h2>
        {anglers.length === 0 ? (
          <p className="mt-1 text-ink-soft">No anglers yet.</p>
        ) : (
          <ul className="mt-3 divide-y-2 divide-line">
            {anglers.map((a) => (
              <li key={a.id} className="py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{a.avatar}</span>
                  <span className="min-w-0 flex-1 truncate font-bold">
                    {a.nickname} {a.isMod && <ModBadge className="ml-1" />}
                  </span>
                  <button
                    onClick={() => {
                      setModFor(modFor?.id === a.id ? null : a);
                      setModPassword("");
                      setError(null);
                    }}
                    disabled={busy}
                    className="rounded-xl border-2 border-line px-3 py-1.5 text-sm font-bold text-gold hover:border-gold disabled:opacity-50"
                  >
                    {a.isMod ? "Remove mod" : "Make mod"}
                  </button>
                  <button
                    onClick={() => removeAngler(a)}
                    disabled={busy}
                    className="rounded-xl border-2 border-line px-3 py-1.5 text-sm font-bold text-bobber hover:border-bobber disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
                {modFor?.id === a.id && (
                  <form onSubmit={changeMod} className="mt-2 rounded-2xl bg-gold-soft p-3">
                    <p className="text-sm font-semibold text-ink">
                      {a.isMod
                        ? `Remove ${a.nickname}'s mod status? Their mods-only gear goes back to standard.`
                        : `Make ${a.nickname} a mod? They get mods-only badges, boats and titles. Nothing changes about lakes or answers.`}
                    </p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="password"
                        required
                        autoFocus
                        autoComplete="current-password"
                        placeholder="Your password"
                        value={modPassword}
                        onChange={(e) => setModPassword(e.target.value)}
                        className="min-w-0 flex-1 rounded-xl border-2 border-line bg-shore px-3 py-2 outline-none focus:border-water"
                      />
                      <Button type="submit" disabled={busy || !modPassword} className="py-2">
                        {a.isMod ? "Remove mod" : "Make mod"}
                      </Button>
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-sm text-ink-soft">
          Mods get special badges, boats and titles. Changing mod status asks for your password, so kids can&apos;t do it
          themselves. Deleting an angler removes their progress and catches for good.
        </p>
      </Card>

      <Card className="border-bobber/40">
        <h2 className="text-lg font-black">Delete account</h2>
        <p className="mt-1 text-ink-soft">
          Permanently deletes your account, every angler, and all progress and catches. Enter your password to confirm.
        </p>
        <form onSubmit={deleteAccount} className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border-2 border-line bg-shore px-3 py-2.5 text-lg outline-none focus:border-water"
          />
          <Button type="submit" disabled={busy || !password}>
            Delete everything
          </Button>
        </form>
      </Card>

      {error && <p className="rounded-xl bg-bobber-soft px-3 py-2 font-semibold text-bobber">{error}</p>}
    </div>
  );
}
