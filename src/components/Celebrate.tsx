"use client";

import { useMemo } from "react";

/** A burst of confetti over the page. Pure CSS; it doesn't move for anyone who prefers reduced motion. */
export function Confetti({ pieces = 60 }: { pieces?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.6 + Math.random() * 1.2,
        drift: (Math.random() - 0.5) * 160,
        spin: (Math.random() - 0.5) * 900,
        color: ["#e23d28", "#d99a06", "#3f7d20", "#1c6e8c", "#0e7490", "#f5c518"][i % 6],
        round: i % 3 === 0,
      })),
    [pieces],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {bits.map((b, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              left: `${b.left}%`,
              background: b.color,
              borderRadius: b.round ? "999px" : "2px",
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.duration}s`,
              "--drift": `${b.drift}px`,
              "--spin": `${b.spin}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
