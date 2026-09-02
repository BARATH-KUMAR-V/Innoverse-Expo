import { pool } from "../db/pool";
import { VotingConfigRow } from "../types/models";

export async function getVotingConfig(): Promise<VotingConfigRow> {
  const result = await pool.query<VotingConfigRow>("select * from voting_config where id = 1");
  if (result.rows.length > 0) {
    return result.rows[0];
  }
  // Should never happen (schema.sql seeds this row on setup), but guard anyway.
  const inserted = await pool.query<VotingConfigRow>(
    `insert into voting_config (id, voting_open, winners_published)
     values (1, false, false)
     on conflict (id) do update set updated_at = now()
     returning *`
  );
  return inserted.rows[0];
}

export async function setVotingOpen(open: boolean): Promise<VotingConfigRow> {
  const result = await pool.query<VotingConfigRow>(
    `update voting_config
     set voting_open = $1,
         opened_at = case when $1 then now() else opened_at end,
         closed_at = case when $1 then closed_at else now() end,
         updated_at = now()
     where id = 1
     returning *`,
    [open]
  );
  return result.rows[0];
}

export async function setWinnersPublished(published: boolean): Promise<VotingConfigRow> {
  const result = await pool.query<VotingConfigRow>(
    `update voting_config
     set winners_published = $1,
         updated_at = now()
     where id = 1
     returning *`,
    [published]
  );
  return result.rows[0];
}
