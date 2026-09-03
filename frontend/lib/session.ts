import { randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { pool } from "./db";
import { env } from "./env";
import { UserRow } from "./models";

export const SESSION_COOKIE_NAME = "innoverse.sid";
export const OAUTH_STATE_COOKIE_NAME = "innoverse.oauth_state";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days, same lifetime as the old express-session cookie.

/**
 * Both the frontend and the API now live on the same Vercel deployment, so
 * this cookie is always first-party - unlike the old cross-site Vercel <->
 * Render setup, `SameSite=Lax` is correct in every environment, not just
 * locally.
 */
export const sessionCookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

export async function createSession(userId: string): Promise<string> {
  const sessionId = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await pool.query("insert into sessions (id, user_id, expires_at) values ($1, $2, $3)", [
    sessionId,
    userId,
    expiresAt,
  ]);
  return sessionId;
}

export async function destroySession(sessionId: string): Promise<void> {
  await pool.query("delete from sessions where id = $1", [sessionId]);
}

export async function getSessionUser(req: NextRequest): Promise<UserRow | null> {
  const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const result = await pool.query<UserRow>(
    `select u.* from sessions s
     join users u on u.id = s.user_id
     where s.id = $1 and s.expires_at > now()`,
    [sessionId]
  );
  return result.rows[0] ?? null;
}
