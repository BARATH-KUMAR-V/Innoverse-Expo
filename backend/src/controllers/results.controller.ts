import { Request, Response } from "express";
import { getVotingConfig } from "../services/votingConfig.service";
import { rankingsWithVotes } from "../services/votes.service";

export async function getResults(_req: Request, res: Response) {
  const config = await getVotingConfig();
  if (!config.winners_published) {
    return res.json({ published: false, winners: [] });
  }

  const rankings = await rankingsWithVotes();
  const winners = rankings.slice(0, 3).map((r, index) => ({
    rank: index + 1,
    teamId: r.teamId,
    teamName: r.teamName,
    votes: r.votes,
  }));

  res.json({ published: true, winners });
}
