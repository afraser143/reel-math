import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { jsonBody, route } from "@/lib/server/errors";
import { ModSchema, setUnlockAll } from "@/lib/server/gear";
import { requireUser } from "@/lib/server/session";

/** Parent only (password required): open or re-lock every lake and the Open Ocean for an angler. */
export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const input = ModSchema.parse(await jsonBody(req));
  await setUnlockAll(await getDb(), user.id, (await ctx.params).id, input);
  return NextResponse.json({ ok: true });
});
