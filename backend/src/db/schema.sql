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
-- the backend at login time, never trust this table alone for that check).
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
-- SESSION STORE
-- Used by connect-pg-simple to persist login sessions in Postgres so they
-- survive backend restarts/redeploys on Render. The backend also creates this
-- automatically on first boot if it does not exist yet, so this block is only
-- here so the table exists immediately even before the server's first run.
-- ---------------------------------------------------------------------------
create table if not exists "session" (
  "sid"     varchar not null collate "default",
  "sess"    json not null,
  "expire"  timestamp(6) not null
)
with (oids = false);

alter table "session" drop constraint if exists "session_pkey";
alter table "session" add constraint "session_pkey" primary key ("sid") not deferrable initially immediate;

create index if not exists "IDX_session_expire" on "session" ("expire");
