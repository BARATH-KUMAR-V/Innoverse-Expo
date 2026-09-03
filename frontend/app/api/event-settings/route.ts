import { NextRequest, NextResponse } from "next/server";
import { handleRoute } from "@/lib/api-handler";
import { getEventSettings, toPublicEventSettings } from "@/lib/services/eventSettings";
import { getVotingConfig, computeVotingState } from "@/lib/services/votingConfig";

// Public on purpose - the expo date/venue/schedule and current voting state
// are meant to be visible on the landing page before anyone signs in.
export const GET = handleRoute(async (_req: NextRequest) => {
  const [settings, config] = await Promise.all([getEventSettings(), getVotingConfig()]);
  return NextResponse.json({
    ...toPublicEventSettings(settings),
    votingState: computeVotingState(config),
  });
});
