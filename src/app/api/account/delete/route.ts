import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { deleteAccount } from "@/lib/server/auth";
import { jsonBody, route } from "@/lib/server/errors";
import { endSession, requireUser } from "@/lib/server/session";

const DeleteSchema = z.object({ password: z.string().min(1, "Enter your password") });

/** Permanently deletes the signed-in parent's account and everything in it. */
export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const { password } = DeleteSchema.parse(await jsonBody(req));
  await deleteAccount(await getDb(), user.id, password);
  await endSession();
  return NextResponse.json({ ok: true });
});
