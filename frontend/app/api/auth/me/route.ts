import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { toPublicUser } from "@/lib/services/users";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null });
  }
  return NextResponse.json({ authenticated: true, user: toPublicUser(user) });
}
