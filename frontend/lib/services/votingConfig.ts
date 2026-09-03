import { pool } from "../db";
import { VotingConfigRow, VotingState } from "../models";
import { getEventSettings } from "./eventSettings";

/**
 * There is no persistent process to run a scheduler here (Route Handlers
 * are stateless serverless functions), so the admin-configured
 * `voting_ends_at` (Admin -> Event Settings) is applied lazily instead:
 * every time the voting config is read, close voting first if the deadline
 * has already passed. The gallery, vote-status checks, and the admin
 * dashboard (polled every 30s) all call this during a live event, so voting
 * still closes automatically on the next request after the deadline - it
 * just isn't driven by a background scheduler. This is also the backstop
 * behind "backend rules remain authoritative": even if an admin's browser
 * still shows a stale 'voting open' control, a request arriving after
 * voting_ends_at is met with a config this function has already closed.
 */
async function applyAutoCloseIfDue(config: VotingConfigRow): Promise<VotingConfigRow> {
  if (!config.voting_open) {
    return config;
  }
  const { voting_ends_at } = await getEventSettings();
  if (!voting_ends_at || Date.now() < new Date(voting_ends_at).getTime()) {
    return config;
  }
  return setVotingOpen(false);
}

export async function getVotingConfig(): Promise<VotingConfigRow> {
  const result = await pool.query<VotingConfigRow>("select * from voting_config where id = 1");
  if (result.rows.length > 0) {
    return applyAutoCloseIfDue(result.rows[0]);
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

/**
 * The four-state model the student-facing UI shows (NOT STARTED / LIVE /
 * CLOSED / RESULTS PUBLISHED). `voting_open` (toggled by the admin's
 * Start/Stop buttons, subject to the auto-close backstop above) remains the
 * one source of truth for whether a vote is actually accepted - this is a
 * display-only projection of it plus the configured schedule, distinguishing
 * "never started yet" from "was open and has since closed" for a case
 * `voting_open` alone can't tell apart.
 */
export function computeVotingState(config: VotingConfigRow): VotingState {
  if (config.winners_published) return "RESULTS_PUBLISHED";
  if (config.voting_open) return "LIVE";
  if (config.opened_at) return "CLOSED";
  return "NOT_STARTED";
}
