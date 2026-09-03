export interface UserRow {
  id: string;
  google_id: string;
  name: string;
  email: string;
  picture: string | null;
  created_at: Date;
}

export interface TeamRow {
  id: string;
  team_name: string;
  image_url: string | null;
  video_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface VotingConfigRow {
  id: number;
  voting_open: boolean;
  winners_published: boolean;
  opened_at: Date | null;
  closed_at: Date | null;
  updated_at: Date;
}

export interface EventSettingsRow {
  id: number;
  expo_name: string;
  expo_date: string | null;
  expo_venue: string | null;
  voting_starts_at: Date | null;
  voting_ends_at: Date | null;
  winners_announce_at: Date | null;
  updated_at: Date;
}

export type VotingState = "NOT_STARTED" | "LIVE" | "CLOSED" | "RESULTS_PUBLISHED";
