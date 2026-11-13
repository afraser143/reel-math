import { getSpecies } from "@/lib/domain/fish";

/**
 * A bass drawn in SVG, coloured by species. Size scales with weight so a
 * lunker looks like one.
 */
export function Fish({ speciesId, weightOz, className = "" }: { speciesId: string; weightOz?: number; className?: string }) {
  const species = getSpecies(speciesId);
  const body = species?.color ?? "#4d7c0f";
  const scale = weightOz === undefined ? 1 : 0.7 + Math.min(weightOz / (8 * 16), 1) * 0.5;
  return (
    <svg viewBox="0 0 200 110" className={className} style={{ transform: `scale(${scale})` }} role="img" aria-label={species?.name ?? "Bass"}>
      {/* tail */}
      <path d="M152 55 L196 22 L188 55 L196 88 Z" fill={body} />
      {/* dorsal fin */}
      <path d="M62 26 Q 90 4 128 22 L 120 34 L 70 34 Z" fill={body} opacity="0.85" />
      {/* body */}
      <ellipse cx="92" cy="56" rx="66" ry="32" fill={body} />
      {/* belly */}
      <path d="M36 66 Q 92 96 150 64 Q 92 78 36 66 Z" fill="#f4ecc8" opacity="0.9" />
      {/* lateral stripe for largemouth and spotted, bars for smallmouth */}
      {speciesId === "smallmouth" || speciesId === "redeye" ? (
        <g stroke="#3b2a12" strokeWidth="5" opacity="0.35">
          <line x1="70" y1="34" x2="66" y2="74" />
          <line x1="92" y1="30" x2="88" y2="78" />
          <line x1="114" y1="32" x2="110" y2="76" />
        </g>
      ) : (
        <path d="M40 54 Q 70 46 96 56 T 152 54" stroke="#1f2d10" strokeWidth="6" fill="none" opacity="0.4" strokeLinecap="round" />
      )}
      {/* big bass mouth */}
      <path d="M26 52 Q 32 66 50 64" stroke="#1f2d10" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* eye */}
      <circle cx="44" cy="44" r="8" fill={speciesId === "redeye" ? "#dc2626" : "#fff"} />
      <circle cx="45" cy="44" r="4" fill="#111" />
      {/* pectoral fin */}
      <path d="M70 62 Q 84 74 74 84 Q 66 74 70 62 Z" fill="#000" opacity="0.15" />
    </svg>
  );
}

export function Bobber({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 60" className={className} aria-hidden>
      <line x1="20" y1="0" x2="20" y2="14" stroke="currentColor" strokeWidth="2" />
      <rect x="18" y="10" width="4" height="8" rx="1" fill="#f8fafc" />
      <circle cx="20" cy="36" r="16" fill="#f8fafc" />
      <path d="M4 36 A16 16 0 0 1 36 36 Z" fill="var(--bobber)" />
      <line x1="4" y1="36" x2="36" y2="36" stroke="#1d2a33" strokeWidth="1.5" />
    </svg>
  );
}
