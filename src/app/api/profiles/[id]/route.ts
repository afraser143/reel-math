import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { route } from "@/lib/server/errors";
import { deleteProfile } from "@/lib/server/fishing";
import { requireUser } from "@/lib/server/session";

/** Deletes an angler and all of their progress. */
export const DELETE = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  await deleteProfile(await getDb(), user.id, (await ctx.params).id);
  return NextResponse.json({ ok: true });
});
