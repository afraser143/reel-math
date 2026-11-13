import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { jsonBody, route } from "@/lib/server/errors";
import { createProfile, listProfiles, NewProfileSchema } from "@/lib/server/fishing";
import { requireUser } from "@/lib/server/session";

export const GET = route(async () => {
  const user = await requireUser();
  return NextResponse.json({ profiles: await listProfiles(await getDb(), user.id) });
});

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const input = NewProfileSchema.parse(await jsonBody(req));
  const profile = await createProfile(await getDb(), user.id, input);
  return NextResponse.json({ profile }, { status: 201 });
});
