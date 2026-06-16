-- ════════════════════════════════════════════════════════════════════════
--  Dubai Schools — Supabase schema (Backend Architect role)
--  Run in the Supabase SQL editor. Idempotent where practical.
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Enums ──────────────────────────────────────────────────────────────────
do $$ begin
  create type curriculum as enum
    ('British','American','IB','Indian (CBSE)','Indian (ICSE)','French','UAE/MoE','Other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type school_gender as enum ('Boys','Girls','Mixed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type khda_rating as enum
    ('Outstanding','Very Good','Good','Acceptable','Weak','Not Rated');
exception when duplicate_object then null; end $$;

-- ── Tables ─────────────────────────────────────────────────────────────────
create table if not exists schools (
  id              text primary key,
  name            text not null,
  area            text not null,
  curriculum      curriculum not null,
  gender          school_gender not null default 'Mixed',
  age_range       text not null,
  khda_rating     khda_rating not null default 'Not Rated',
  fee_min_aed     integer not null check (fee_min_aed >= 0),
  fee_max_aed     integer not null check (fee_max_aed >= fee_min_aed),
  has_vacancy     boolean not null default false,
  vacancy_note    text,
  founded         integer,
  website         text,
  phone           text,
  lat             double precision,
  lng             double precision,
  logo_url        text,
  description     text,
  fee_bands       jsonb not null default '[]'::jsonb,
  nationality_mix jsonb not null default '[]'::jsonb,
  admissions_note text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_schools_area       on schools (area);
create index if not exists idx_schools_curriculum on schools (curriculum);
create index if not exists idx_schools_vacancy    on schools (has_vacancy);

create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  school_id   text not null references schools(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  author_name text not null default 'Anonymous',
  rating      smallint not null check (rating between 1 and 5),
  title       text,
  body        text not null check (char_length(body) between 4 and 4000),
  scores      jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_reviews_school on reviews (school_id, created_at desc);

-- ── Aggregate view consumed by the app ─────────────────────────────────────
create or replace view schools_with_stats as
select
  s.*,
  coalesce(round(avg(r.rating)::numeric, 1), 0)::float as avg_rating,
  count(r.id)::int                                     as review_count
from schools s
left join reviews r on r.school_id = s.id
group by s.id;

-- ── Row Level Security ─────────────────────────────────────────────────────
alter table schools enable row level security;
alter table reviews enable row level security;

-- Schools: world-readable, writes restricted to service role / admins.
drop policy if exists "schools_public_read" on schools;
create policy "schools_public_read" on schools
  for select using (true);

-- Reviews: anyone can read; authenticated users can insert their own;
-- authors can edit/delete only their own.
drop policy if exists "reviews_public_read" on reviews;
create policy "reviews_public_read" on reviews
  for select using (true);

drop policy if exists "reviews_insert_authenticated" on reviews;
create policy "reviews_insert_authenticated" on reviews
  for insert to authenticated
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "reviews_update_own" on reviews;
create policy "reviews_update_own" on reviews
  for update to authenticated
  using (auth.uid() = user_id);

drop policy if exists "reviews_delete_own" on reviews;
create policy "reviews_delete_own" on reviews
  for delete to authenticated
  using (auth.uid() = user_id);

-- NOTE: For an anonymous-review MVP you may instead allow `anon` inserts.
-- Swap the insert policy for:
--   create policy "reviews_insert_anon" on reviews
--     for insert to anon with check (true);
-- and add basic rate limiting at the edge before launch.
