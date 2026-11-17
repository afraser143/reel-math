import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { jsonBody, route } from "@/lib/server/errors";
import { ModSchema, setMod } from "@/lib/server/gear";
import { requireUser } from "@/lib/server/session";

/** Parent only (password required): turn an angler's mod status on or off. */
export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const input = ModSchema.parse(await jsonBody(req));
  await setMod(await getDb(), user.id, (await ctx.params).id, input);
  return NextResponse.json({ ok: true });
});
