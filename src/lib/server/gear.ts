import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { profiles } from "@/db/schema";
import { ALL_BADGES, BOATS, DEFAULT_BOAT, getBoat, isModBadge, STANDARD_BADGES, TITLES } from "@/lib/domain/gear";
import { checkPassword } from "./auth";
import { HttpError } from "./errors";
import { getOwnedProfile } from "./fishing";

export const ModSchema = z.object({
  enabled: z.boolean(),
  password: z.string().min(1, "Enter your password"),
});

/**
 * Turns mod status on or off. Needs the parent's password, because kids use the app
 * signed in as their parent. Turning it off puts mods-only gear back to standard.
 */
export async function setMod(db: Db, userId: string, profileId: string, input: z.infer<typeof ModSchema>) {
  const profile = await getOwnedProfile(db, userId, profileId);
  await checkPassword(db, userId, input.password);
  const reset = input.enabled
    ? {}
    : {
        title: null,
        boat: getBoat(profile.boat).modOnly ? DEFAULT_BOAT : profile.boat,
        avatar: isModBadge(profile.avatar) ? STANDARD_BADGES[0] : profile.avatar,
      };
  await db
    .update(profiles)
    .set({ isMod: input.enabled, ...reset })
    .where(eq(profiles.id, profile.id));
}

export const GearSchema = z.object({
  avatar: z.enum(ALL_BADGES).optional(),
  boat: z.enum(BOATS.map((b) => b.id) as [string, ...string[]]).optional(),
  title: z.enum(TITLES).nullable().optional(),
});

/** Saves badge, boat and title. Mods-only choices are refused for anyone who isn't a mod. */
export async function setGear(db: Db, userId: string, profileId: string, input: z.infer<typeof GearSchema>) {
  const profile = await getOwnedProfile(db, userId, profileId);
  const wantsModGear =
    (input.avatar !== undefined && isModBadge(input.avatar)) ||
    (input.boat !== undefined && getBoat(input.boat).modOnly) ||
    (input.title !== undefined && input.title !== null);
  if (wantsModGear && !profile.isMod) throw new HttpError(403, "That's mods only");
  await db.update(profiles).set(input).where(eq(profiles.id, profile.id));
  return getOwnedProfile(db, userId, profileId);
}
