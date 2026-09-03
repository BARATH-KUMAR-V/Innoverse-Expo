import { NextRequest, NextResponse } from "next/server";
import { handleRoute, requireAdmin } from "@/lib/api-handler";
import { setVotingOpen } from "@/lib/services/votingConfig";

export const POST = handleRoute(async (req: NextRequest) => {
  await requireAdmin(req);
  const config = await setVotingOpen(false);
  return NextResponse.json({ votingOpen: config.voting_open });
});
