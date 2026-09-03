import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForAccessToken, fetchGoogleUserInfo } from "@/lib/google-oauth";
import { upsertUserFromGoogle } from "@/lib/services/users";
import { createSession, OAUTH_STATE_COOKIE_NAME, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/session";
import { env } from "@/lib/env";

/**
 * Custom callback (instead of a library's default failure redirect) so we
 * can tell a rejected non-college domain apart from a genuine server/network
 * error and send the frontend a useful ?authError= reason for its banner
 * message - same contract the old Passport-based callback used.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;

  const fail = (reason: "domain" | "server") => {
    const res = NextResponse.redirect(`${origin}/?authError=${reason}`);
    res.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return res;
  };

  if (!code || !state || !expectedState || state !== expectedState) {
    console.error("Google OAuth error: missing or mismatched state");
    return fail("server");
  }

  try {
    const accessToken = await exchangeCodeForAccessToken(code);
    const profile = await fetchGoogleUserInfo(accessToken);

    const email = profile.email?.toLowerCase();
    if (!email) {
      return fail("server");
    }

    // The backend is the source of truth for the domain check - the
    // frontend never decides who is allowed in.
    const domain = email.split("@")[1];
    if (domain !== env.allowedEmailDomain) {
      return fail("domain");
    }

    const user = await upsertUserFromGoogle({
      googleId: profile.sub,
      name: profile.name || email,
      email,
      picture: profile.picture ?? null,
    });

    const sessionId = await createSession(user.id);

    const res = NextResponse.redirect(`${origin}/gallery`);
    res.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    res.cookies.set(SESSION_COOKIE_NAME, sessionId, sessionCookieOptions);
    return res;
  } catch (err) {
    console.error("Google OAuth error:", err);
    return fail("server");
  }
}
