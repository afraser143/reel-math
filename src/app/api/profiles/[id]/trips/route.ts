import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { jsonBody, route } from "@/lib/server/errors";
import { getOwnedProfile, startTrip } from "@/lib/server/fishing";
import { requireUser } from "@/lib/server/session";

const TripSchema = z.object({
  focusTable: z.number().int().optional(),
  water: z.enum(["fresh", "salt"]).optional(),
});

/** Starts a fishing trip: returns the cards to practise, chosen by spaced repetition. */
export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const db = await getDb();
  const profile = await getOwnedProfile(db, user.id, (await ctx.params).id);
  const { focusTable, water } = TripSchema.parse(await jsonBody(req));
  return NextResponse.json({ cards: await startTrip(db, profile.id, { focusTable, water }) });
});
