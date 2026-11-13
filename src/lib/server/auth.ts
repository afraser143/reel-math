import { createHash, randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { sessions, users } from "@/db/schema";
import { HttpError } from "./errors";

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const CredentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ message: "Enter a valid email" })),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});
export type Credentials = z.infer<typeof CredentialsSchema>;

export interface SessionUser {
  id: string;
  email: string;
}

// A real hash to check against when the email doesn't exist, so a failed
// login takes the same time either way and doesn't reveal which emails exist.
let dummyHash: Promise<string> | undefined;

export async function register(db: Db, creds: Credentials): Promise<SessionUser> {
  const passwordHash = await hash(creds.password);
  const [user] = await db
    .insert(users)
    .values({ email: creds.email, passwordHash })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id, email: users.email });
  if (!user) throw new HttpError(409, "An account with that email already exists");
  return user;
}

export async function login(db: Db, creds: Credentials): Promise<SessionUser> {
  const [user] = await db.select().from(users).where(eq(users.email, creds.email));
  dummyHash ??= hash("not-a-real-password");
  const ok = await verify(user?.passwordHash ?? (await dummyHash), creds.password);
  if (!user || !ok) throw new HttpError(401, "Wrong email or password");
  return { id: user.id, email: user.email };
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Creates a session and returns the raw token for the cookie. Only its hash is stored. */
export async function createSession(db: Db, userId: string, now = new Date()) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  await db.insert(sessions).values({ tokenHash: hashToken(token), userId, expiresAt });
  return { token, expiresAt };
}

export async function userForToken(db: Db, token: string, now = new Date()): Promise<SessionUser | null> {
  const [row] = await db
    .select({ id: users.id, email: users.email })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, now)));
  return row ?? null;
}

export async function deleteSession(db: Db, token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}
