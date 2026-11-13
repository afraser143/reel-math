import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (what = "Not found") => new HttpError(404, what);

/** Wraps a route handler so thrown HttpErrors and validation errors become JSON responses. */
export function route<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return NextResponse.json({ error: "Invalid request", issues: err.issues }, { status: 400 });
      }
      console.error(err);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
  };
}

/** Parses a JSON body. Requiring a JSON content type also blocks simple cross-site form posts. */
export async function jsonBody(req: Request): Promise<unknown> {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    throw new HttpError(415, "Expected application/json");
  }
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
}
