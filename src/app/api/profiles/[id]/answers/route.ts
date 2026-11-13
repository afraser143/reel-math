import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { jsonBody, route } from "@/lib/server/errors";
import { AnswerSchema, getOwnedProfile, recordAnswer } from "@/lib/server/fishing";
import { requireUser } from "@/lib/server/session";

export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const db = await getDb();
  const profile = await getOwnedProfile(db, user.id, (await ctx.params).id);
  const input = AnswerSchema.parse(await jsonBody(req));
  return NextResponse.json(await recordAnswer(db, profile.id, input));
});
