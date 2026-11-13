import "server-only";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/db";
import { HttpError } from "./errors";
import { getOwnedProfile } from "./fishing";
import { currentUser } from "./session";

/** For server-rendered pages: the signed-in parent, or a redirect to sign in. */
export async function pageUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

/** For server-rendered pages: the angler, if this parent owns it, or a 404. */
export async function pageAngler(id: string) {
  const user = await pageUser();
  const db = await getDb();
  try {
    return { user, db, angler: await getOwnedProfile(db, user.id, id) };
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) notFound();
    throw err;
  }
}
