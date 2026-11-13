import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { CredentialsSchema, login } from "@/lib/server/auth";
import { jsonBody, route } from "@/lib/server/errors";
import { startSession } from "@/lib/server/session";

export const POST = route(async (req: Request) => {
  const creds = CredentialsSchema.parse(await jsonBody(req));
  const user = await login(await getDb(), creds);
  await startSession(user.id);
  return NextResponse.json({ ok: true });
});
