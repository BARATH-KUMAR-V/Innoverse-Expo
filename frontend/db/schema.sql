-- =============================================================================
-- INNOVERSE - Prompt to Product Expo
-- Core database schema.
--
-- HOW TO RUN THIS FILE:
--   Supabase dashboard -> SQL Editor -> New query -> paste this whole file -> Run.
--   It is safe to run more than once (every statement uses IF NOT EXISTS).
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- USERS
-- One row per authenticated Google account (always @nec.edu.in - enforced by
-- the app at login time, never trust this table alone for that check).
-- ---------------------------------------------------------------------------
create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  google_id   text not null unique,
  name        text not null,
  email       text not null unique,
  picture     text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- TEAMS
-- The exhibited products students vote for.
-- is_active = false means "archived" (hidden from the public gallery) rather
-- than deleted, which happens automatically when an admin tries to delete a
-- team that already has votes recorded against it - this protects voting
-- integrity while still letting admins clean up the gallery.
-- ---------------------------------------------------------------------------
create table if not exists teams (
  id          uuid primary key default gen_random_uuid(),
  team_name   text not null,
  image_url   text,
  video_url   text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- VOTES
-- The unique constraint on user_id is the database-level guarantee behind
-- "one student = one vote" - it holds even if the API layer is bypassed.
-- ---------------------------------------------------------------------------
create table if not exists votes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references users(id) on delete restrict,
  team_id     uuid not null references teams(id) on delete restrict,
  voted_at    timestamptz not null default now()
);

create index if not exists idx_votes_team_id on votes (team_id);

-- ---------------------------------------------------------------------------
-- VOTING CONFIGURATION
-- Single-row table (id is always 1) holding the live voting state.
-- ---------------------------------------------------------------------------
create table if not exists voting_config (
  id                  smallint primary key default 1,
  voting_open         boolean not null default false,
  winners_published   boolean not null default false,
  opened_at           timestamptz,
  closed_at           timestamptz,
  updated_at          timestamptz not null default now(),
  constraint voting_config_singleton check (id = 1)
);

insert into voting_config (id, voting_open, winners_published)
values (1, false, false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- EVENT SETTINGS
-- Single-row table (id is always 1) holding the admin-editable event
-- schedule and details. Every page that used to hardcode the expo date,
-- venue, voting-closes time, or winner-announcement time now reads it from
-- here via /api/event-settings - editable from Admin -> Event Settings.
-- `voting_ends_at` also drives the automatic close-off in
-- lib/services/votingConfig.ts (there is no scheduler process here, so it is
-- applied lazily whenever voting status is read - see that file).
-- All timestamps are timestamptz (stored as UTC, always interpreted against
-- Asia/Kolkata when displayed) so enforcement never depends on a browser's
-- local clock.
-- ---------------------------------------------------------------------------
create table if not exists event_settings (
  id                    smallint primary key default 1,
  expo_name             text not null default 'INNOVERSE — Prompt to Product Expo',
  expo_date             text,
  expo_venue            text,
  voting_starts_at      timestamptz,
  voting_ends_at        timestamptz,
  winners_announce_at   timestamptz,
  updated_at            timestamptz not null default now(),
  constraint event_settings_singleton check (id = 1)
);

-- Seeded with the same example schedule this project shipped with, so local
-- setup still shows real-looking content - change every field from Admin ->
-- Event Settings before the actual event.
insert into event_settings (id, expo_name, expo_date, expo_venue, voting_starts_at, voting_ends_at, winners_announce_at)
values (
  1,
  'INNOVERSE — Prompt to Product Expo',
  'Thursday – Saturday, 10:00 AM – 5:00 PM',
  'Ground Floor, NewGen IEDC, Tech Park, National Engineering College',
  '2026-09-03T10:00:00+05:30',
  '2026-09-05T13:30:00+05:30',
  '2026-09-05T14:00:00+05:30'
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- SESSIONS
-- Login sessions, looked up by the `innoverse.sid` httpOnly cookie on every
-- request (see frontend/lib/session.ts). A student or admin signing out, or
-- a session simply expiring, just removes/ignores its row here - there is no
-- separate server process to hold this in memory the way the old Express
-- backend's express-session middleware did.
-- ---------------------------------------------------------------------------
create table if not exists sessions (
  id          text primary key,
  user_id     uuid not null references users(id) on delete cascade,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_sessions_expires_at on sessions (expires_at);
