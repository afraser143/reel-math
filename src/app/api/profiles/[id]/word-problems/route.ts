import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { route } from "@/lib/server/errors";
import { getOwnedProfile } from "@/lib/server/fishing";
import { requireUser } from "@/lib/server/session";
import { aiEnabled, claudeGenerator, getWordProblems } from "@/lib/server/wordProblems";

export const maxDuration = 60;

/** Builds a set of fishing word problems aimed at the facts he finds hardest. */
export const POST = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const db = await getDb();
  const profile = await getOwnedProfile(db, user.id, (await ctx.params).id);
  const generator = aiEnabled() ? claudeGenerator : null;
  return NextResponse.json({ problems: await getWordProblems(db, user.id, profile.id, generator) });
});
