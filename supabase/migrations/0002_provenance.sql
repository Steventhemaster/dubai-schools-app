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
