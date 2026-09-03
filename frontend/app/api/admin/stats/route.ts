import { NextRequest, NextResponse } from "next/server";
import { handleRoute, requireAdmin } from "@/lib/api-handler";
import { getVotingConfig } from "@/lib/services/votingConfig";
import { totalVoteCount } from "@/lib/services/votes";
import { countUsers } from "@/lib/services/users";

export const GET = handleRoute(async (req: NextRequest) => {
  await requireAdmin(req);
  const [config, votes, eligibleVoters] = await Promise.all([getVotingConfig(), totalVoteCount(), countUsers()]);
  const participation = eligibleVoters > 0 ? (votes / eligibleVoters) * 100 : 0;
  return NextResponse.json({
    votingOpen: config.voting_open,
    winnersPublished: config.winners_published,
    totalVotes: votes,
    // "Eligible voters" here means students who have signed in with a valid
    // @nec.edu.in account - there is no separate roster upload feature, so
    // this is the most accurate figure the system can derive on its own.
    eligibleVoters,
    participation: Math.round(participation * 10) / 10,
  });
});
