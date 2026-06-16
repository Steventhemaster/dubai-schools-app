-- ═══════════════════════════════════════════════════════════════
-- Dubai Schools — ONE-SHOT SETUP (schema + 0002 + 0003 combined)
-- Paste this whole file into the Supabase SQL Editor and click Run.
-- Expected result: 'Success. No rows returned'
-- ═══════════════════════════════════════════════════════════════

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

-- ──────────────── migration 0002 ────────────────
-- ════════════════════════════════════════════════════════════════════════
--  Migration 0002 — data provenance + open-data alignment
--  Adds source-tracking columns and relaxes NOT NULLs that the KHDA open
--  dataset does not provide (fees, age_range). Run AFTER schema.sql.
-- ════════════════════════════════════════════════════════════════════════

-- ── Provenance & open-data fields ──────────────────────────────────────────
alter table schools add column if not exists name_ar         text;
alter table schools add column if not exists enrollment      integer;
alter table schools add column if not exists capacity        integer;
alter table schools add column if not exists data_year       text;     -- e.g. '2024-2025'
alter table schools add column if not exists source          text;     -- e.g. 'dubai_pulse_khda'
alter table schools add column if not exists source_ref      text;     -- KHDA school id / dataset row key
alter table schools add column if not exists source_url      text;
alter table schools add column if not exists last_synced_at  timestamptz;
-- Fees come from a DIFFERENT source than KHDA open data — track separately.
alter table schools add column if not exists fees_source     text;     -- e.g. 'prospectus', 'community'
alter table schools add column if not exists fees_updated_at timestamptz;

-- ── Relax constraints the open dataset can't satisfy ───────────────────────
-- The KHDA open data has no fees and not always an age range, so allow NULL
-- and let the app render "fees not available yet".
alter table schools alter column fee_min_aed drop not null;
alter table schools alter column fee_max_aed drop not null;
alter table schools alter column age_range   drop not null;

-- Replace the old (min<=max) check with a NULL-tolerant version.
alter table schools drop constraint if exists schools_fee_max_aed_check;
alter table schools drop constraint if exists schools_fee_check;
alter table schools add constraint schools_fee_check
  check (
    fee_min_aed is null
    or fee_max_aed is null
    or fee_max_aed >= fee_min_aed
  );

create index if not exists idx_schools_source on schools (source);
create index if not exists idx_schools_year   on schools (data_year);

-- ── Recreate the stats view so the new columns are exposed to the app ──────
create or replace view schools_with_stats as
select
  s.*,
  coalesce(round(avg(r.rating)::numeric, 1), 0)::float as avg_rating,
  count(r.id)::int                                     as review_count
from schools s
left join reviews r on r.school_id = s.id
group by s.id;

-- ── Ingestion audit log (every sync run records a row) ─────────────────────
create table if not exists ingestion_runs (
  id            uuid primary key default gen_random_uuid(),
  source        text not null,
  dataset       text,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  rows_seen     integer default 0,
  rows_upserted integer default 0,
  rows_skipped  integer default 0,
  status        text not null default 'running',  -- running | success | failed
  error         text,
  notes         jsonb
);

-- ──────────────── migration 0003 ────────────────
-- ════════════════════════════════════════════════════════════════════════
--  Migration 0003 — auth hardening + UGC moderation
--  Run AFTER 0002. Safe on existing data (constraints added NOT VALID first).
--  Covers: security review H-1/H-2/M-1/M-2/M-3/L-1/L-4, App Store 1.2
--  (report/flag + moderation), Apple 5.1.1(v) (account deletion), and the
--  vacancy tri-state fix (KHDA data has no vacancy info — must not show
--  "No vacancy" for 226 schools).
-- ════════════════════════════════════════════════════════════════════════
begin;

-- ── 1. Lock down ingestion_runs (H-1) ──────────────────────────────────────
alter table ingestion_runs enable row level security;
revoke all on table ingestion_runs from anon, authenticated;
-- service_role bypasses RLS — ingestion pipeline unaffected.

-- ── 2. Stats view runs with caller permissions (M-1) ───────────────────────
alter view schools_with_stats set (security_invoker = true);

-- ── 3. Vacancy tri-state: null = unknown (KHDA open data has no vacancy) ───
alter table schools alter column has_vacancy drop not null;
alter table schools alter column has_vacancy drop default;

-- ── 4. Profiles: server-owned display names + ban flag ─────────────────────
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  is_banned    boolean not null default false,
  created_at   timestamptz not null default now()
);
alter table profiles enable row level security;

create policy "profiles_public_read" on profiles
  for select using (true);
create policy "profiles_update_own" on profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and is_banned = false);
-- No insert policy: rows are created by the trigger below (definer).

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), 'Parent')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 5. Reviews: close the user_id null escape hatch (H-2) ──────────────────
alter table reviews alter column user_id set default auth.uid();

drop policy if exists "reviews_insert_authenticated" on reviews;
create policy "reviews_insert_authenticated" on reviews
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and not exists (select 1 from profiles p where p.id = auth.uid() and p.is_banned)
  );

-- ── 6. Server-enforced fields: no backdating, no review-moving (L-1, L-4) ──
create or replace function public.reviews_enforce_server_fields()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.user_id    := auth.uid();
    -- Display name comes from the profile, not the client (impersonation guard)
    select display_name into new.author_name from profiles where id = auth.uid();
    new.author_name := coalesce(new.author_name, 'Anonymous');
  elsif tg_op = 'UPDATE' then
    new.created_at  := old.created_at;
    new.user_id     := old.user_id;
    new.school_id   := old.school_id;
    new.author_name := old.author_name;
  end if;
  return new;
end $$;

drop trigger if exists trg_reviews_server_fields on reviews;
create trigger trg_reviews_server_fields
  before insert or update on reviews
  for each row execute function public.reviews_enforce_server_fields();

-- ── 7. Rate limit + one review per school per user (M-2) ───────────────────
create unique index if not exists uniq_review_per_user_school
  on reviews (school_id, user_id)
  where user_id is not null;

create or replace function public.reviews_rate_limit()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if (select count(*) from reviews
      where user_id = auth.uid()
        and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'Review limit reached. Try again tomorrow.'
      using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists trg_reviews_rate_limit on reviews;
create trigger trg_reviews_rate_limit
  before insert on reviews
  for each row execute function public.reviews_rate_limit();

-- ── 8. Input bounds on UGC columns (M-3) ───────────────────────────────────
alter table reviews add constraint reviews_author_name_len
  check (char_length(author_name) between 1 and 60) not valid;
alter table reviews validate constraint reviews_author_name_len;

alter table reviews add constraint reviews_title_len
  check (title is null or char_length(title) <= 120) not valid;
alter table reviews validate constraint reviews_title_len;

alter table reviews add constraint reviews_scores_bounds
  check (
    scores is null
    or (jsonb_typeof(scores) = 'object' and pg_column_size(scores) <= 2048)
  ) not valid;
alter table reviews validate constraint reviews_scores_bounds;

-- ── 9. Moderation status + report mechanism (App Store 1.2) ────────────────
alter table reviews add column if not exists status text not null default 'published'
  check (status in ('published','hidden','removed'));

-- Hidden/removed reviews invisible to everyone except their author.
drop policy if exists "reviews_public_read" on reviews;
create policy "reviews_public_read" on reviews
  for select using (status = 'published' or auth.uid() = user_id);

-- Authors cannot edit moderated reviews back to life.
drop policy if exists "reviews_update_own" on reviews;
create policy "reviews_update_own" on reviews
  for update to authenticated
  using (auth.uid() = user_id and status = 'published')
  with check (auth.uid() = user_id and status = 'published');

-- Recreate view: only published reviews count toward ratings; keep invoker.
create or replace view schools_with_stats
with (security_invoker = true) as
select
  s.*,
  coalesce(round(avg(r.rating)::numeric, 1), 0)::float as avg_rating,
  count(r.id)::int                                     as review_count
from schools s
left join reviews r on r.school_id = s.id and r.status = 'published'
group by s.id;

create table if not exists review_reports (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid not null references reviews(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason      text not null check (reason in
                ('spam','harassment','false_information','inappropriate','other')),
  detail      text check (detail is null or char_length(detail) <= 1000),
  created_at  timestamptz not null default now(),
  unique (review_id, reporter_id)              -- one report per user per review
);
alter table review_reports enable row level security;
revoke all on table review_reports from anon;

create policy "reports_insert_authenticated" on review_reports
  for insert to authenticated
  with check (auth.uid() = reporter_id);
-- No select/update/delete policies: reports are write-only for users;
-- moderation happens via service_role / dashboard.

-- ── 10. Account deletion (Apple Guideline 5.1.1(v)) ────────────────────────
-- Reviews keep their content but lose attribution (user_id → null via FK).
create or replace function public.delete_my_account()
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke execute on function public.delete_my_account() from anon, public;
grant execute on function public.delete_my_account() to authenticated;

commit;
