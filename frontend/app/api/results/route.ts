import { NextRequest, NextResponse } from "next/server";
import { handleRoute } from "@/lib/api-handler";
import { getVotingConfig } from "@/lib/services/votingConfig";
import { rankingsWithVotes } from "@/lib/services/votes";

// Public on purpose - published results are meant to be visible to everyone,
// signed in or not.
export const GET = handleRoute(async (_req: NextRequest) => {
  const config = await getVotingConfig();
  if (!config.winners_published) {
    return NextResponse.json({ published: false, winners: [] });
  }

  const rankings = await rankingsWithVotes();
  const winners = rankings.slice(0, 3).map((r, index) => ({
    rank: index + 1,
    teamId: r.teamId,
    teamName: r.teamName,
    votes: r.votes,
  }));

  return NextResponse.json({ published: true, winners });
});
