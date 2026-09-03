import { pool } from "../db";

export const UNIQUE_VIOLATION = "23505";
export const FOREIGN_KEY_VIOLATION = "23503";

export async function getUserVote(userId: string): Promise<{ teamId: string } | null> {
  const result = await pool.query<{ team_id: string }>("select team_id from votes where user_id = $1", [userId]);
  if (result.rows.length === 0) return null;
  return { teamId: result.rows[0].team_id };
}

export async function insertVote(userId: string, teamId: string): Promise<void> {
  await pool.query("insert into votes (user_id, team_id) values ($1, $2)", [userId, teamId]);
}

export async function totalVoteCount(): Promise<number> {
  const result = await pool.query<{ count: number }>("select count(*)::int as count from votes");
  return result.rows[0]?.count ?? 0;
}

export interface RankingRow {
  teamId: string;
  teamName: string;
  votes: number;
}

export async function rankingsWithVotes(): Promise<RankingRow[]> {
  const result = await pool.query<{ team_id: string; team_name: string; votes: number }>(
    `select t.id as team_id, t.team_name, count(v.id)::int as votes
     from teams t
     left join votes v on v.team_id = t.id
     group by t.id
     order by votes desc, t.created_at asc`
  );
  return result.rows.map((row) => ({ teamId: row.team_id, teamName: row.team_name, votes: row.votes }));
}

export async function deleteAllVotes(): Promise<number> {
  const result = await pool.query<{ count: number }>(
    "with deleted as (delete from votes returning id) select count(*)::int as count from deleted"
  );
  return result.rows[0]?.count ?? 0;
}

export interface VoterRow {
  voterEmail: string;
  voterName: string;
  teamName: string;
  votedAt: string;
}

export async function votersWithTeams(): Promise<VoterRow[]> {
  const result = await pool.query<{
    voter_email: string;
    voter_name: string;
    team_name: string;
    voted_at: string;
  }>(
    `select u.email as voter_email, u.name as voter_name, t.team_name, v.voted_at
     from votes v
     join users u on u.id = v.user_id
     join teams t on t.id = v.team_id
     order by v.voted_at desc`
  );
  return result.rows.map((r) => ({
    voterEmail: r.voter_email,
    voterName: r.voter_name,
    teamName: r.team_name,
    votedAt: r.voted_at,
  }));
}

