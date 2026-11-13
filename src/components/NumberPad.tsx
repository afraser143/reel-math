"use client";

import { useEffect } from "react";

/**
 * Big tablet-friendly number pad. Also listens to the keyboard, so it works
 * on a laptop without tapping.
 */
export function NumberPad({
  value,
  onChange,
  onSubmit,
  disabled,
  submitLabel = "Reel it in!",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  submitLabel?: string;
}) {
  useEffect(() => {
    if (disabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key) && value.length < 3) onChange(value + e.key);
      else if (e.key === "Backspace") onChange(value.slice(0, -1));
      else if (e.key === "Enter" && value) onSubmit();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [value, onChange, onSubmit, disabled]);

  const key = "h-16 rounded-2xl bg-card border-2 border-line text-3xl font-black text-ink shadow-[0_3px_0_var(--line)] active:translate-y-0.5 active:shadow-none disabled:opacity-40 sm:h-[4.5rem]";

  return (
    <div className="mx-auto grid w-full max-w-sm grid-cols-3 gap-3">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <button key={n} type="button" className={key} disabled={disabled || value.length >= 3} onClick={() => onChange(value + n)}>
          {n}
        </button>
      ))}
      <button type="button" className={`${key} text-2xl`} disabled={disabled || !value} onClick={() => onChange(value.slice(0, -1))} aria-label="Delete">
        ⌫
      </button>
      <button type="button" className={key} disabled={disabled || value.length >= 3} onClick={() => onChange(value + "0")}>
        0
      </button>
      <button
        type="button"
        className="h-16 rounded-2xl bg-bobber text-lg font-black leading-tight text-white shadow-[0_3px_0_rgba(0,0,0,0.3)] active:translate-y-0.5 active:shadow-none disabled:opacity-40 sm:h-[4.5rem]"
        disabled={disabled || !value}
        onClick={onSubmit}
      >
        {submitLabel}
      </button>
    </div>
  );
}
