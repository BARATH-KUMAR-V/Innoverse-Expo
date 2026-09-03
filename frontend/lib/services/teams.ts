import { pool } from "../db";
import { TeamRow } from "../models";

export async function listActiveTeams(): Promise<TeamRow[]> {
  const result = await pool.query<TeamRow>("select * from teams where is_active = true order by created_at asc");
  return result.rows;
}

export async function getTeamById(id: string): Promise<TeamRow | null> {
  const result = await pool.query<TeamRow>("select * from teams where id = $1", [id]);
  return result.rows[0] ?? null;
}

export async function listAllTeamsWithVoteCounts(): Promise<(TeamRow & { votes: number })[]> {
  const result = await pool.query<TeamRow & { votes: number }>(
    `select t.*, count(v.id)::int as votes
     from teams t
     left join votes v on v.team_id = t.id
     group by t.id
     order by t.created_at asc`
  );
  return result.rows;
}

export async function createTeam(params: {
  teamName: string;
  imageUrl: string | null;
  videoUrl: string | null;
}): Promise<TeamRow> {
  const result = await pool.query<TeamRow>(
    `insert into teams (team_name, image_url, video_url)
     values ($1, $2, $3)
     returning *`,
    [params.teamName, params.imageUrl, params.videoUrl]
  );
  return result.rows[0];
}

export async function updateTeam(
  id: string,
  params: { teamName?: string; imageUrl?: string; videoUrl?: string }
): Promise<TeamRow | null> {
  const existing = await getTeamById(id);
  if (!existing) return null;

  const teamName = params.teamName ?? existing.team_name;
  const imageUrl = params.imageUrl ?? existing.image_url;
  const videoUrl = params.videoUrl ?? existing.video_url;

  const result = await pool.query<TeamRow>(
    `update teams
     set team_name = $1, image_url = $2, video_url = $3, updated_at = now()
     where id = $4
     returning *`,
    [teamName, imageUrl, videoUrl, id]
  );
  return result.rows[0];
}

export async function countVotesForTeam(teamId: string): Promise<number> {
  const result = await pool.query<{ count: number }>("select count(*)::int as count from votes where team_id = $1", [
    teamId,
  ]);
  return result.rows[0]?.count ?? 0;
}

export async function archiveTeam(id: string): Promise<void> {
  await pool.query("update teams set is_active = false, updated_at = now() where id = $1", [id]);
}

export async function hardDeleteTeam(id: string): Promise<void> {
  await pool.query("delete from teams where id = $1", [id]);
}
