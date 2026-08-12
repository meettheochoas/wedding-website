-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New Query → paste → Run)

create table if not exists rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_id text not null unique,
  guest_name text not null,
  attending text not null check (attending in ('yes', 'no')),
  submitted_at timestamptz not null default now()
);

-- Speeds up admin dashboard sorting by most-recent-first
create index if not exists rsvps_submitted_at_idx on rsvps (submitted_at desc);

-- Row Level Security: locked down by default. The app only ever talks to this table
-- through the server-side service role key (in the API routes), which bypasses RLS,
-- so guests' browsers never get direct database access.
alter table rsvps enable row level security;
