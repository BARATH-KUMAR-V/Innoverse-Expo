import { Request, Response } from "express";
import { getVotingConfig } from "../services/votingConfig.service";
import { getUserVote, insertVote, UNIQUE_VIOLATION, FOREIGN_KEY_VIOLATION } from "../services/votes.service";
import { getTeamById } from "../services/teams.service";
import { HttpError } from "../utils/httpError";

export async function getVotingStatus(_req: Request, res: Response) {
  const config = await getVotingConfig();
  res.json({ votingOpen: config.voting_open });
}

export async function getMyVote(req: Request, res: Response) {
  const userId = req.user!.id;
  const vote = await getUserVote(userId);
  res.json({ hasVoted: !!vote, teamId: vote?.teamId ?? null });
}

export async function submitVote(req: Request, res: Response) {
  const userId = req.user!.id;
  const teamId = typeof req.body?.teamId === "string" ? req.body.teamId : null;

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
  const existingVote = await getUserVote(userId);
  if (existingVote) {
    throw new HttpError(409, "already_voted", "You have already cast your vote.");
  }

  // 4. Insert - the UNIQUE constraint on votes.user_id is what actually
  //    prevents a duplicate vote under concurrent requests, refreshes,
  //    multiple tabs, or a direct API call that skips the checks above.
  try {
    await insertVote(userId, teamId);
  } catch (err: any) {
    if (err?.code === UNIQUE_VIOLATION) {
      throw new HttpError(409, "already_voted", "You have already cast your vote.");
    }
    if (err?.code === FOREIGN_KEY_VIOLATION) {
      throw new HttpError(404, "team_not_found", "This product is currently unavailable.");
    }
    throw err;
  }

  res.status(201).json({ success: true });
}
