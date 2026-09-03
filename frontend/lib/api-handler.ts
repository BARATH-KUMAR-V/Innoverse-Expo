import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "./session";
import { HttpError } from "./http-error";
import { isAdminEmail } from "./env";
import { UserRow } from "./models";

type RouteHandler = (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<NextResponse>;

/**
 * Wraps a Route Handler so a thrown HttpError becomes the same clean JSON
 * error shape ({ error, message }) the old Express `errorHandler` produced,
 * and any other thrown error is logged and turned into a generic 500 -
 * replaces `middleware/errorHandler.ts` + `utils/asyncHandler.ts`.
 */
export function handleRoute(fn: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.code, message: err.message }, { status: err.statusCode });
      }
      console.error("Unhandled error:", err);
      return NextResponse.json(
        { error: "server_error", message: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }
  };
}

/** Replaces `middleware/auth.ts`'s `ensureAuthenticated` - throw-and-catch instead of next(err). */
export async function requireAuth(req: NextRequest): Promise<UserRow> {
  const user = await getSessionUser(req);
  if (!user) {
    throw new HttpError(401, "not_authenticated", "Please sign in to continue.");
  }
  return user;
}

/** Replaces `middleware/auth.ts`'s `ensureAdmin`. */
export async function requireAdmin(req: NextRequest): Promise<UserRow> {
  const user = await requireAuth(req);
  if (!isAdminEmail(user.email)) {
    throw new HttpError(403, "forbidden", "Admin access required.");
  }
  return user;
}
