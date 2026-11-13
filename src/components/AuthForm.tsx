"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card } from "./ui";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    if (res.ok) {
      router.push("/anglers");
      router.refresh();
      return;
    }
    const body = await res.json().catch(() => ({}));
    setError(body.issues?.[0]?.message ?? body.error ?? "Something went wrong");
    setBusy(false);
  }

  const input = "mt-1 w-full rounded-xl border-2 border-line bg-shore px-3 py-2.5 text-lg text-ink outline-none focus:border-water";

  return (
    <Card className="mx-auto max-w-md">
      <p className="mb-4 text-ink-soft">
        {signup ? "Parents: make an account, then add your angler." : "Welcome back to the dock."}
      </p>
      <form onSubmit={submit} className="space-y-4">
        <label className="block font-bold">
          Parent email
          <input name="email" type="email" required autoComplete="email" className={input} />
        </label>
        <label className="block font-bold">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={signup ? "new-password" : "current-password"}
            className={input}
          />
        </label>
        {error && <p className="rounded-xl bg-bobber-soft px-3 py-2 font-semibold text-bobber">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {signup ? "Create account" : "Sign in"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-soft">
        {signup ? (
          <>
            Already have an account? <Link className="font-bold text-water underline" href="/login">Sign in</Link>
          </>
        ) : (
          <>
            New here? <Link className="font-bold text-water underline" href="/signup">Create an account</Link>
          </>
        )}
      </p>
    </Card>
  );
}
