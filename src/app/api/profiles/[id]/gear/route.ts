import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { jsonBody, route } from "@/lib/server/errors";
import { GearSchema, setGear } from "@/lib/server/gear";
import { requireUser } from "@/lib/server/session";

/** Save an angler's badge, boat and title. */
export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const input = GearSchema.parse(await jsonBody(req));
  const profile = await setGear(await getDb(), user.id, (await ctx.params).id, input);
  return NextResponse.json({ profile });
});
