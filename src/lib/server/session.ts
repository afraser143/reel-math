import "server-only";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { createSession, deleteSession, userForToken, type SessionUser } from "./auth";
import { HttpError } from "./errors";

const COOKIE = "rm_session";

export async function startSession(userId: string): Promise<void> {
  const { token, expiresAt } = await createSession(await getDb(), userId);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await deleteSession(await getDb(), token);
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  return userForToken(await getDb(), token);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Please sign in");
  return user;
}
