import { NextRequest, NextResponse } from "next/server";
import { handleRoute, requireAdmin } from "@/lib/api-handler";
import { rankingsWithVotes } from "@/lib/services/votes";

export const GET = handleRoute(async (req: NextRequest) => {
  await requireAdmin(req);
  const rankings = await rankingsWithVotes();
  return NextResponse.json(rankings);
});
