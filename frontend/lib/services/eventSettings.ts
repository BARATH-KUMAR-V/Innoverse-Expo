import { pool } from "../db";
import { EventSettingsRow } from "../models";

export async function getEventSettings(): Promise<EventSettingsRow> {
  const result = await pool.query<EventSettingsRow>("select * from event_settings where id = 1");
  if (result.rows.length > 0) {
    return result.rows[0];
  }
  // Should never happen (schema.sql seeds this row on setup), but guard anyway.
  const inserted = await pool.query<EventSettingsRow>(
    `insert into event_settings (id) values (1)
     on conflict (id) do update set updated_at = now()
     returning *`
  );
  return inserted.rows[0];
}

export interface EventSettingsUpdate {
  expoName?: string;
  expoDate?: string | null;
  expoVenue?: string | null;
  votingStartsAt?: string | null;
  votingEndsAt?: string | null;
  winnersAnnounceAt?: string | null;
}

export async function updateEventSettings(update: EventSettingsUpdate): Promise<EventSettingsRow> {
  const existing = await getEventSettings();

  const expoName = update.expoName ?? existing.expo_name;
  const expoDate = update.expoDate !== undefined ? update.expoDate : existing.expo_date;
  const expoVenue = update.expoVenue !== undefined ? update.expoVenue : existing.expo_venue;
  const votingStartsAt = update.votingStartsAt !== undefined ? update.votingStartsAt : existing.voting_starts_at;
  const votingEndsAt = update.votingEndsAt !== undefined ? update.votingEndsAt : existing.voting_ends_at;
  const winnersAnnounceAt =
    update.winnersAnnounceAt !== undefined ? update.winnersAnnounceAt : existing.winners_announce_at;

  const result = await pool.query<EventSettingsRow>(
    `update event_settings
     set expo_name = $1,
         expo_date = $2,
         expo_venue = $3,
         voting_starts_at = $4,
         voting_ends_at = $5,
         winners_announce_at = $6,
         updated_at = now()
     where id = 1
     returning *`,
    [expoName, expoDate, expoVenue, votingStartsAt, votingEndsAt, winnersAnnounceAt]
  );
  return result.rows[0];
}

export function toPublicEventSettings(row: EventSettingsRow) {
  return {
    expoName: row.expo_name,
    expoDate: row.expo_date,
    expoVenue: row.expo_venue,
    votingStartsAt: row.voting_starts_at,
    votingEndsAt: row.voting_ends_at,
    winnersAnnounceAt: row.winners_announce_at,
  };
}
