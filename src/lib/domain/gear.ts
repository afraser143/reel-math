/**
 * Angler gear: badges, boats and titles. Some are mods-only. A parent turns mod status on
 * (it needs the parent's password), and the server checks it before saving any mods-only gear.
 * Mods get bragging rights, never shortcuts: nothing here unlocks lakes or changes answers.
 */

export const STANDARD_BADGES = ["🎣", "🐟", "🚤", "🧢", "🦅", "🐊", "🐸", "🦆"] as const;
export const MOD_BADGES = ["👑", "🦈", "🐉", "⚡", "🔱", "🏆"] as const;
export const ALL_BADGES = [...STANDARD_BADGES, ...MOD_BADGES] as const;

export interface Boat {
  id: string;
  emoji: string;
  name: string;
  modOnly: boolean;
}

export const BOATS: readonly Boat[] = [
  { id: "canoe", emoji: "🛶", name: "Canoe", modOnly: false },
  { id: "rowboat", emoji: "🚣", name: "Rowboat", modOnly: false },
  { id: "bass_boat", emoji: "🚤", name: "Bass Boat", modOnly: true },
  { id: "speedboat", emoji: "🛥️", name: "Speedboat", modOnly: true },
  { id: "pirate_ship", emoji: "🏴‍☠️", name: "Pirate Ship", modOnly: true },
];

export const DEFAULT_BOAT = "canoe";

/** Titles shown under a mod's name. All mods-only. */
export const TITLES = ["Captain", "Lure Legend", "Fish Whisperer", "Ocean Ranger", "Lunker Hunter", "Bass Boss"] as const;

export function getBoat(id: string | null | undefined): Boat {
  return BOATS.find((b) => b.id === id) ?? BOATS[0];
}

export function isModBadge(badge: string): boolean {
  return (MOD_BADGES as readonly string[]).includes(badge);
}

/** What someone can actually show: mods-only gear falls back to standard when they aren't a mod. */
export function visibleGear(p: { isMod: boolean; avatar: string; boat: string; title: string | null }) {
  const boat = getBoat(p.boat);
  return {
    avatar: !p.isMod && isModBadge(p.avatar) ? STANDARD_BADGES[0] : p.avatar,
    boat: !p.isMod && boat.modOnly ? getBoat(DEFAULT_BOAT) : boat,
    title: p.isMod ? p.title : null,
  };
}
