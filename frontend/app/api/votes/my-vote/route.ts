import { NextRequest, NextResponse } from "next/server";
import { handleRoute, requireAuth } from "@/lib/api-handler";
import { getUserVote } from "@/lib/services/votes";

export const GET = handleRoute(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const vote = await getUserVote(user.id);
  return NextResponse.json({ hasVoted: !!vote, teamId: vote?.teamId ?? null });
});
