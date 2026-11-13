import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

// The preview card shown when a Reel Math link is shared (iMessage, Slack, email, social).
export const alt = "Reel Math: learn your times tables one bass at a time";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fontFile = (weight: number) =>
  readFile(path.join(process.cwd(), `node_modules/@fontsource/nunito/files/nunito-latin-${weight}-normal.woff`));

export default async function OpengraphImage() {
  const [bold, black] = await Promise.all([fontFile(700), fontFile(900)]);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg, #dff1f7 0%, #9fd0e2 55%, #1c6e8c 100%)",
          fontFamily: "Nunito",
          position: "relative",
        }}
      >
        {/* Water */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 190,
            background: "linear-gradient(180deg, #1c6e8c 0%, #0b3d5c 100%)",
            display: "flex",
          }}
        />
        <svg width="1200" height="60" viewBox="0 0 1200 60" style={{ position: "absolute", left: 0, bottom: 165 }}>
          <path d="M0 30 Q 75 0 150 30 T 300 30 T 450 30 T 600 30 T 750 30 T 900 30 T 1050 30 T 1200 30 V60 H0 Z" fill="#1c6e8c" />
        </svg>

        <div style={{ display: "flex", alignItems: "center", padding: "70px 80px 0", gap: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#1c6e8c", letterSpacing: 1 }}>
              7 × 8 = ?
            </div>
            <div style={{ display: "flex", fontSize: 120, fontWeight: 900, color: "#1d2a33", lineHeight: 1, marginTop: 12 }}>
              Reel Math
            </div>
            <div style={{ display: "flex", fontSize: 42, fontWeight: 700, color: "#1d2a33", marginTop: 22, maxWidth: 620, lineHeight: 1.25 }}>
              Learn your times tables one bass at a time.
            </div>
          </div>
          {/* Bobber */}
          <svg width="150" height="225" viewBox="0 0 40 60">
            <line x1="20" y1="0" x2="20" y2="14" stroke="#1d2a33" strokeWidth="1.5" />
            <rect x="18" y="10" width="4" height="8" rx="1" fill="#f8fafc" />
            <circle cx="20" cy="36" r="16" fill="#f8fafc" />
            <path d="M4 36 A16 16 0 0 1 36 36 Z" fill="#e23d28" />
            <line x1="4" y1="36" x2="36" y2="36" stroke="#1d2a33" strokeWidth="1.2" />
          </svg>
        </div>

        {/* Bass, leaping out of the water */}
        <svg width="360" height="198" viewBox="0 0 200 110" style={{ position: "absolute", right: 90, bottom: 70 }}>
          <path d="M152 55 L196 22 L188 55 L196 88 Z" fill="#4d7c0f" />
          <path d="M62 26 Q 90 4 128 22 L 120 34 L 70 34 Z" fill="#4d7c0f" opacity="0.85" />
          <ellipse cx="92" cy="56" rx="66" ry="32" fill="#4d7c0f" />
          <path d="M36 66 Q 92 96 150 64 Q 92 78 36 66 Z" fill="#f4ecc8" opacity="0.9" />
          <path d="M40 54 Q 70 46 96 56 T 152 54" stroke="#1f2d10" strokeWidth="6" fill="none" opacity="0.4" strokeLinecap="round" />
          <path d="M26 52 Q 32 66 50 64" stroke="#1f2d10" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="44" cy="44" r="8" fill="#fff" />
          <circle cx="45" cy="44" r="4" fill="#111" />
        </svg>

        <div
          style={{
            position: "absolute",
            left: 80,
            bottom: 62,
            display: "flex",
            gap: 16,
            fontSize: 28,
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          <div style={{ display: "flex", background: "#e23d28", borderRadius: 999, padding: "10px 24px" }}>Free</div>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.18)", borderRadius: 999, padding: "10px 24px" }}>
            Catch a bass for every right answer
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Nunito", data: bold, weight: 700, style: "normal" },
        { name: "Nunito", data: black, weight: 900, style: "normal" },
      ],
    },
  );
}
