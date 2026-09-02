import { pool } from "../db/pool";

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
