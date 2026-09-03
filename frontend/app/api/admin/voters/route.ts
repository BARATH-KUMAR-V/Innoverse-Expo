import { NextRequest, NextResponse } from "next/server";
import { handleRoute, requireAdmin } from "@/lib/api-handler";
import { votersWithTeams } from "@/lib/services/votes";

export const GET = handleRoute(async (req: NextRequest) => {
  await requireAdmin(req);
  const voters = await votersWithTeams();
  return NextResponse.json(voters);
});
