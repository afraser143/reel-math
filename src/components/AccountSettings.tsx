"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card } from "./ui";

interface Angler {
  id: string;
  nickname: string;
  avatar: string;
}

export function AccountSettings({ email, anglers }: { email: string; anglers: Angler[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");

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
              <li key={a.id} className="flex items-center gap-3 py-2.5">
                <span className="text-2xl">{a.avatar}</span>
                <span className="min-w-0 flex-1 truncate font-bold">{a.nickname}</span>
                <button
                  onClick={() => removeAngler(a)}
                  disabled={busy}
                  className="rounded-xl border-2 border-line px-3 py-1.5 text-sm font-bold text-bobber hover:border-bobber disabled:opacity-50"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-sm text-ink-soft">Deleting an angler removes their progress and catches for good.</p>
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
