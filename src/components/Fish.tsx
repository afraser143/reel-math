import { getSpecies, type Species } from "@/lib/domain/fish";

/**
 * Fish drawn in SVG, shaped and coloured by species. Size scales with weight
 * (relative to how big that species gets), so a trophy looks like one.
 */
export function Fish({ speciesId, weightOz, className = "" }: { speciesId: string; weightOz?: number; className?: string }) {
  const species = getSpecies(speciesId);
  const scale =
    weightOz === undefined || !species ? 1 : 0.7 + Math.min(weightOz / (species.maxLb * 16), 1) * 0.5;
  return (
    <svg
      viewBox="0 0 200 110"
      className={className}
      style={{ transform: `scale(${scale})`, overflow: "visible" }}
      role="img"
      aria-label={species?.name ?? "Fish"}
    >
      {species ? <Body species={species} /> : null}
    </svg>
  );
}

const BELLY = "#f4ecc8";
const INK = "#1f2d10";

function Eye({ x = 44, y = 44, r = 8, color = "#fff" }: { x?: number; y?: number; r?: number; color?: string }) {
  return (
    <>
      <circle cx={x} cy={y} r={r} fill={color} />
      <circle cx={x + 1} cy={y} r={r / 2} fill="#111" />
    </>
  );
}

function Body({ species }: { species: Species }) {
  const c = species.color;
  switch (species.shape) {
    case "flat": // flounder: a flat oval with both eyes on top
      return (
        <g>
          <path d="M160 55 L194 34 L190 55 L194 76 Z" fill={c} />
          <ellipse cx="92" cy="56" rx="72" ry="38" fill={c} />
          <ellipse cx="92" cy="56" rx="72" ry="38" fill="none" stroke="#5c5144" strokeWidth="5" strokeDasharray="2 6" opacity="0.5" />
          {[
            [70, 45], [100, 65], [120, 42], [85, 72], [135, 60],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="5" fill="#5c5144" opacity="0.35" />
          ))}
          <Eye x={38} y={40} r={6} />
          <Eye x={48} y={52} r={6} />
        </g>
      );
    case "billfish": // sailfish and marlin: a spear bill and a tall dorsal sail
      return (
        <g>
          <path d="M150 55 L198 18 L184 55 L198 92 Z" fill={c} />
          <path
            d="M52 36 Q 70 -4 122 6 Q 128 22 128 34 Z"
            fill={c}
            opacity={species.id === "sailfish" ? 0.85 : 0.6}
          />
          <path d="M2 50 L36 50 L36 56 Z" fill={c} />
          <ellipse cx="92" cy="56" rx="62" ry="22" fill={c} />
          <path d="M34 62 Q 92 84 152 60 Q 92 70 34 62 Z" fill="#dbe7f5" />
          {species.id === "blue_marlin" &&
            [70, 88, 106, 124].map((x) => (
              <line key={x} x1={x} y1="40" x2={x - 4} y2="70" stroke="#93c5fd" strokeWidth="3" opacity="0.6" />
            ))}
          <Eye x={44} y={50} r={6} />
        </g>
      );
    case "mahi": // mahi-mahi (a big "bull"): a near-vertical forehead, one fin along the whole back,
      // a long fin along the belly, a deeply forked tail, blue-green fading to gold with turquoise spots
      return (
        <g>
          <defs>
            <linearGradient id="mahi-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0e7490" />
              <stop offset="0.38" stopColor="#1f9d6b" />
              <stop offset="0.7" stopColor="#c8c21c" />
              <stop offset="1" stopColor="#facc15" />
            </linearGradient>
          </defs>
          {/* deeply forked tail */}
          <path d="M154 56 L198 14 L184 56 L198 98 Z" fill="#d4a017" />
          {/* dorsal fin from just behind the eye all the way to the tail */}
          <path d="M30 20 Q 96 2 156 50 L 150 54 Q 96 16 32 28 Z" fill="#0e7490" />
          {/* anal fin along the back half of the belly */}
          <path d="M92 80 Q 128 92 156 62 L 152 58 Q 126 80 94 76 Z" fill="#d4a017" />
          {/* body: square blunt head, tapering to a slim tail */}
          <path d="M24 24 C 18 42, 18 64, 28 80 Q 94 88 156 62 L 156 52 Q 98 22 24 24 Z" fill="url(#mahi-body)" />
          {[
            [56, 40], [78, 36], [100, 40], [122, 46], [66, 50], [90, 50], [112, 54], [138, 54],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="2.4" fill="#22d3ee" opacity="0.75" />
          ))}
          {/* pectoral fin and mouth */}
          <path d="M52 62 Q 70 66 66 78 Q 56 72 52 62 Z" fill="#0e7490" opacity="0.7" />
          <path d="M22 66 Q 30 72 42 70" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <Eye x={36} y={46} r={6} />
        </g>
      );
    case "slim": // snook and tarpon: long silver body with a dark lateral line
      return (
        <g>
          <path d="M156 55 L198 26 L188 55 L198 84 Z" fill={c} />
          <path d="M72 32 Q 92 14 116 30 L 108 38 L 78 38 Z" fill={c} opacity="0.85" />
          <ellipse cx="94" cy="56" rx="70" ry="24" fill={c} />
          <path d="M30 64 Q 94 86 160 62 Q 94 72 30 64 Z" fill="#f1f5f9" />
          {species.id === "snook" ? (
            <path d="M34 54 Q 94 50 160 54" stroke="#0f172a" strokeWidth="4" fill="none" opacity="0.7" />
          ) : (
            <g opacity="0.25">
              {[60, 80, 100, 120, 140].map((x) => (
                <path key={x} d={`M${x} 40 q 6 16 0 32`} stroke="#334155" strokeWidth="2" fill="none" />
              ))}
            </g>
          )}
          <path d="M24 54 Q 30 64 46 62" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
          <Eye x={42} y={48} r={7} />
        </g>
      );
    case "trout": // speckled trout: slender, silvery, covered in dark spots
      return (
        <g>
          <path d="M154 55 L196 28 L188 55 L196 82 Z" fill={c} />
          <path d="M66 30 Q 92 12 122 28 L 114 36 L 72 36 Z" fill={c} opacity="0.85" />
          <ellipse cx="92" cy="56" rx="66" ry="26" fill={c} />
          <path d="M34 64 Q 92 88 152 62 Q 92 74 34 64 Z" fill={BELLY} opacity="0.8" />
          {[
            [70, 44], [86, 40], [102, 44], [118, 40], [134, 46], [78, 54], [96, 52], [112, 54], [128, 56], [146, 50],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="3" fill="#1e293b" opacity="0.7" />
          ))}
          <path d="M28 54 Q 34 64 50 62" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
          <Eye x={44} y={48} r={7} />
        </g>
      );
    default: // bass, and the bass-shaped redfish
      return (
        <g>
          <path d="M152 55 L196 22 L188 55 L196 88 Z" fill={c} />
          <path d="M62 26 Q 90 4 128 22 L 120 34 L 70 34 Z" fill={c} opacity="0.85" />
          <ellipse cx="92" cy="56" rx="66" ry="32" fill={c} />
          <path d="M36 66 Q 92 96 150 64 Q 92 78 36 66 Z" fill={BELLY} opacity="0.9" />
          {species.id === "redfish" ? (
            // The redfish's black tail spot.
            <circle cx="150" cy="50" r="7" fill="#111" />
          ) : species.id === "smallmouth" || species.id === "redeye" ? (
            <g stroke="#3b2a12" strokeWidth="5" opacity="0.35">
              <line x1="70" y1="34" x2="66" y2="74" />
              <line x1="92" y1="30" x2="88" y2="78" />
              <line x1="114" y1="32" x2="110" y2="76" />
            </g>
          ) : (
            <path d="M40 54 Q 70 46 96 56 T 152 54" stroke={INK} strokeWidth="6" fill="none" opacity="0.4" strokeLinecap="round" />
          )}
          <path d="M26 52 Q 32 66 50 64" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
          <Eye color={species.id === "redeye" ? "#dc2626" : "#fff"} />
          <path d="M70 62 Q 84 74 74 84 Q 66 74 70 62 Z" fill="#000" opacity="0.15" />
        </g>
      );
  }
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
