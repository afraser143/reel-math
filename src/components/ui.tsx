import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const buttonStyles = {
  primary: "bg-bobber text-white shadow-[0_4px_0_rgba(0,0,0,0.25)] hover:brightness-105",
  water: "bg-water text-white shadow-[0_4px_0_rgba(0,0,0,0.25)] hover:brightness-105",
  ghost: "bg-card text-ink border-2 border-line hover:border-water",
} as const;

type Variant = keyof typeof buttonStyles;

const base =
  "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-lg font-bold transition active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:pointer-events-none";

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${base} ${buttonStyles[variant]} ${className}`} {...props} />;
}

export function LinkButton({ variant = "primary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${base} ${buttonStyles[variant]} ${className}`} {...props} />;
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-3xl border-2 border-line bg-card p-5 ${className}`}>{children}</div>;
}

/** Header strip with the water band used on every screen. */
export function Shell({
  title,
  back,
  right,
  theme = "lake",
  children,
}: {
  title: string;
  back?: { href: string; label: string };
  right?: ReactNode;
  theme?: "lake" | "ocean";
  children: ReactNode;
}) {
  const header = theme === "ocean" ? "from-ocean to-ocean-deep" : "from-water to-water-deep";
  return (
    <div className="min-h-dvh">
      <header className={`bg-gradient-to-b ${header} text-white`}>
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 pb-6 pt-4">
          {back && (
            <Link href={back.href} className="rounded-xl bg-white/15 px-3 py-1.5 text-sm font-bold hover:bg-white/25">
              ← {back.label}
            </Link>
          )}
          <h1 className="min-w-0 flex-1 truncate text-2xl font-black tracking-tight">{title}</h1>
          {right}
        </div>
        <Waves />
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">{children}</main>
    </div>
  );
}

export function Waves() {
  return (
    <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className="block h-6 w-full" aria-hidden>
      <path d="M0 20 Q 75 0 150 20 T 300 20 T 450 20 T 600 20 T 750 20 T 900 20 T 1050 20 T 1200 20 V40 H0 Z" fill="var(--shore)" />
    </svg>
  );
}

export function ProgressBar({ value, max, color = "bg-reed" }: { value: number; max: number; color?: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-line/60" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** The 🛡️ MOD badge shown next to a mod's name. */
export function ModBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-xs font-black text-white ${className}`}>
      🛡️ MOD
    </span>
  );
}
