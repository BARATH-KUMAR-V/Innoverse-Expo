import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { buildGoogleAuthUrl } from "@/lib/google-oauth";
import { OAUTH_STATE_COOKIE_NAME, sessionCookieOptions } from "@/lib/session";

/** Full-page navigation target for "Continue with Google" - kicks off the OAuth redirect dance. */
export async function GET(_req: NextRequest) {
  const state = randomBytes(16).toString("base64url");
  const res = NextResponse.redirect(buildGoogleAuthUrl(state));

  // Short-lived CSRF token for the callback to verify - not a login session,
  // so it gets its own brief expiry rather than the 7-day session lifetime.
  res.cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
    ...sessionCookieOptions,
    maxAge: 60 * 10,
  });

  return res;
}
