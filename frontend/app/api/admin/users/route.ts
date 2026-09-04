import { NextRequest, NextResponse } from "next/server";
import { handleRoute, requireAdmin } from "@/lib/api-handler";
import { allUsers } from "@/lib/services/users";

export const GET = handleRoute(async (req: NextRequest) => {
  await requireAdmin(req);
  const users = await allUsers();
  return NextResponse.json(users);
});
