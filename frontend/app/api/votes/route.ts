import { NextRequest, NextResponse } from "next/server";
import { handleRoute, requireAuth } from "@/lib/api-handler";
import { getVotingConfig } from "@/lib/services/votingConfig";
import { getUserVote, insertVote, UNIQUE_VIOLATION, FOREIGN_KEY_VIOLATION } from "@/lib/services/votes";
import { getTeamById } from "@/lib/services/teams";
import { HttpError } from "@/lib/http-error";

export const POST = handleRoute(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await req.json().catch(() => ({}));
  const teamId = typeof body?.teamId === "string" ? body.teamId : null;

  if (!teamId) {
    throw new HttpError(400, "validation_error", "A team must be selected.");
  }

  // 1. Voting must currently be open.
  const config = await getVotingConfig();
  if (!config.voting_open) {
    throw new HttpError(403, "voting_closed", "Voting has closed. No further votes can be submitted.");
  }

  // 2. The team must exist and be visible.
  const team = await getTeamById(teamId);
  if (!team || !team.is_active) {
    throw new HttpError(404, "team_not_found", "This product is currently unavailable.");
  }

  // 3. Friendly pre-check (the real guarantee is the DB unique constraint below).
  const existingVote = await getUserVote(user.id);
  if (existingVote) {
    throw new HttpError(409, "already_voted", "You have already cast your vote.");
  }

  // 4. Insert - the UNIQUE constraint on votes.user_id is what actually
  //    prevents a duplicate vote under concurrent requests, refreshes,
  //    multiple tabs, or a direct API call that skips the checks above.
  try {
    await insertVote(user.id, teamId);
  } catch (err: any) {
    if (err?.code === UNIQUE_VIOLATION) {
      throw new HttpError(409, "already_voted", "You have already cast your vote.");
    }
    if (err?.code === FOREIGN_KEY_VIOLATION) {
      throw new HttpError(404, "team_not_found", "This product is currently unavailable.");
    }
    throw err;
  }

  return NextResponse.json({ success: true }, { status: 201 });
});
