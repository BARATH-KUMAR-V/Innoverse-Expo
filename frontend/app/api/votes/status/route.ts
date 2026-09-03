import { NextRequest, NextResponse } from "next/server";
import { handleRoute, requireAuth } from "@/lib/api-handler";
import { getVotingConfig, computeVotingState } from "@/lib/services/votingConfig";
import { getEventSettings } from "@/lib/services/eventSettings";

export const GET = handleRoute(async (req: NextRequest) => {
  await requireAuth(req);
  const [config, settings] = await Promise.all([getVotingConfig(), getEventSettings()]);
  return NextResponse.json({
    votingOpen: config.voting_open,
    votingState: computeVotingState(config),
    votingEndsAt: settings.voting_ends_at,
    winnersAnnounceAt: settings.winners_announce_at,
  });
});
