"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatWeight } from "@/lib/domain/fish";
import { playFireworks } from "@/lib/sounds";
import { Fish } from "./Fish";

const COLORS = ["#ff5e5b", "#ffd166", "#06d6a0", "#4cc9f0", "#c77dff", "#ffffff", "#f5c518"];

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface Rocket {
  x: number;
  y: number;
  vy: number;
  targetY: number;
  color: string;
}

/**
 * The legendary-catch celebration: a night sky full of fireworks with the blue marlin leaping
 * across it. Drawn on a canvas; anyone who prefers reduced motion gets the night sky and the
 * message without the moving fireworks. Stays until "Awesome!" is tapped.
 */
export function LegendaryCelebration({
  speciesId,
  speciesName,
  weightOz,
  onClose,
}: {
  speciesId: string;
  speciesName: string;
  weightOz: number;
  onClose: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  // The tap that reeled the fish in shouldn't also close the show.
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    playFireworks();
    const t = setTimeout(() => setCanClose(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      el.width = el.clientWidth * dpr;
      el.height = el.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const w = () => el.clientWidth;
    const h = () => el.clientHeight;
    const rockets: Rocket[] = [];
    const sparks: Spark[] = [];
    const started = performance.now();
    const SHOW_MS = 6500;
    let nextLaunch = 0;
    let frame = 0;

    const launch = () => {
      rockets.push({
        x: w() * (0.15 + Math.random() * 0.7),
        y: h(),
        vy: -(9 + Math.random() * 3),
        targetY: h() * (0.12 + Math.random() * 0.35),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    };

    const burst = (x: number, y: number, color: string) => {
      const count = 70 + Math.floor(Math.random() * 40);
      const ring = Math.random() < 0.3; // some bursts are neat rings
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const speed = ring ? 4.2 : 1 + Math.random() * 4.5;
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color: Math.random() < 0.15 ? "#ffffff" : color,
        });
      }
    };

    const tick = (now: number) => {
      const elapsed = now - started;
      // Fade the previous frame for trails.
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
      ctx.fillRect(0, 0, w(), h());
      ctx.globalCompositeOperation = "lighter";

      // A few rockets at once at the start, then a steady stream.
      if (elapsed < SHOW_MS && elapsed >= nextLaunch) {
        launch();
        if (elapsed < 400) launch();
        nextLaunch = elapsed + 260 + Math.random() * 380;
      }

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy;
        r.vy *= 0.985;
        ctx.fillStyle = "#fff4d6";
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
        if (r.y <= r.targetY || r.vy > -2) {
          burst(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.975;
        s.vy = s.vy * 0.975 + 0.06; // gravity
        s.life -= 0.012;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (elapsed < SHOW_MS + 3000 || sparks.length || rockets.length) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Rendered straight onto <body>: inside the animated result card, "fixed" would be
  // trapped to the card's size (an animated transform makes a new containing block).
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Legendary catch: ${speciesName}`}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#05071a] via-[#0b1238] to-[#0a2a4a] px-6 text-center"
    >
      <canvas ref={canvas} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
      <div className="relative">
        <p className="animate-splash text-sm font-black uppercase tracking-[0.3em] text-[#ffd166]">🌟 Legendary catch 🌟</p>
        <div className="animate-leap mx-auto mt-4 w-72 max-w-full">
          <Fish speciesId={speciesId} weightOz={weightOz} className="h-40 w-full drop-shadow-[0_0_24px_rgba(76,201,240,0.6)]" />
        </div>
        <h2 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl">
          You caught the
          <br />
          <span className="text-[#ffd166]">{speciesName.toUpperCase()}!</span>
        </h2>
        <p className="mt-3 text-2xl font-black text-white/90">{formatWeight(weightOz)}</p>
        <button
          type="button"
          onClick={onClose}
          disabled={!canClose}
          autoFocus={canClose}
          className="mt-8 rounded-2xl bg-[#ffd166] px-10 py-4 text-xl font-black text-[#0b1238] shadow-[0_4px_0_rgba(0,0,0,0.35)] transition active:translate-y-0.5 disabled:opacity-0"
        >
          Awesome!
        </button>
      </div>
    </div>,
    document.body,
  );
}
