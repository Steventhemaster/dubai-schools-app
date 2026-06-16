# KHDA Data Ingestion Pipeline

Pulls Dubai school data from official sources, normalizes the messy real-world
values into our canonical schema, validates it, and upserts into Supabase —
without ever clobbering fields owned by other sources.

```
 source ──────────▶ normalize ──▶ validate ──▶ upsert ──▶ Supabase
 (KHDA xlsx |        (mappings)     (zod)      (scoped)    (+ audit log)
  CSV | DubaiPulse)
```

## ⭐ Recommended source: the official KHDA workbook (no key, no login)

KHDA publishes a single Excel file with **everything** — and it's the easiest path:

```bash
cd ingestion && npm install
# download the official file (1.4 MB):
curl -L -o downloads/DubaiPrivateSchoolsOpenData.xlsx \
  https://web.khda.gov.ae/KHDA/media/KHDA/DubaiPrivateSchoolsOpenData.xlsx
npm run ingest -- --source=khda --dry-run    # preview, no write
npm run ingest -- --source=khda              # write to Supabase
```

The `khda` importer reads two sheets from that workbook:
- **"Main information 2024-2025"** → ~226 schools: name (EN/AR), area, lat/lng,
  curriculum, latest DSIB rating, telephone, website, grades, year established,
  latest enrolment.
- **"Fees 2024-2025"** → tuition by grade. Joined to schools by a normalized
  token-set match (exact, else Jaccard ≥ 0.6 — conservative to avoid wrong fees).
  ~132 schools get fees; the rest are absent from the fees sheet and stay null.

This is the **only source that also carries fees**, so the KHDA importer is the
one place allowed to write fee columns (`--source=khda` sets `includeFees`).

## Why a pipeline (not a one-off import)

KHDA inspection ratings, enrolment, and capacity change every academic year.
This pipeline is **idempotent** (same school → same slug id → upsert in place),
**source-tracked** (every row records where it came from and when), and
**re-runnable** on a schedule.

## Data sources

| Source (`--source=`) | What it has | Notes |
|---|---|---|
| **`khda`** — official KHDA xlsx ⭐ | name (EN/AR), area, curriculum, DSIB rating, enrolment, contact, **+ fees by grade** | No key/login. Best source. |
| **`dubaipulse`** — Dubai Pulse API | same school facts (no fees) | Needs API key/secret; portal mid-migration. |
| **`csv`** — any spreadsheet export | whatever columns you provide | Alias-matched headers; fees via `merge:fees`. |

The KHDA xlsx is authoritative for fees, so it's the only sync allowed to write
fee columns. For other sources, fees are loaded separately (`merge:fees`) and
tracked with their own `fees_source` / `fees_updated_at`; those syncs never
overwrite fee or editorial fields.

> ⚖️ **Licence:** Dubai Pulse open datasets are free to use under the portal's
> Open Data terms — **attribution required**. The app shows "Official KHDA open
> data" + last-updated date on each school. Do not scrape copyrighted
> aggregator sites; use the official API/CSV.

## Setup

```bash
cd ingestion
npm install
cp .env.example .env     # fill in Supabase service-role key (+ Dubai Pulse keys)
```

Run the Supabase migrations first (from the app's `supabase/` folder):
`schema.sql` → `migrations/0002_provenance.sql`.

## Usage

### 1. Try it with no credentials (sample CSV)

```bash
npm run ingest -- --source=csv --dry-run
```

Parses `sample/khda_sample.csv` (deliberately messy: mixed-case ratings,
"UK / British", missing names, out-of-range coords) and prints normalized +
validated output. Proves the pipeline end-to-end with zero setup.

### 2. Inspect a real source's columns

```bash
npm run describe -- --source=dubaipulse
```

Prints the actual column names + a sample row so you can confirm/extend the
alias table in `src/mappings.ts`.

### 3. Ingest for real

```bash
# Official API (needs DUBAI_PULSE_API_KEY/SECRET + Supabase service role):
npm run ingest -- --source=dubaipulse

# Or a CSV you downloaded from the Dubai Pulse dataset page:
npm run ingest -- --source=csv --file=./downloads/khda_2025.csv
```

### 4. Layer fees on top

```bash
npm run merge:fees -- --file=./fees/fees_2025.csv --dry-run
npm run merge:fees -- --file=./fees/fees_2025.csv
```

## Getting Dubai Pulse API access

1. Register at <https://www.dubaipulse.gov.ae>.
2. Request access ("Grant") to the KHDA schools dataset(s) — they're open/free.
3. You receive an **API Key** and **API Secret** by email.
4. Put them in `.env`. The pipeline exchanges them for an OAuth token automatically.
5. Confirm the dataset's exact API path on its page and, if it differs from the
   default, set `DUBAI_PULSE_DATA_URL` in `.env`. Use `npm run describe` to verify.

## Scheduling

KHDA data updates roughly per academic year, with rating changes after
inspection cycles. A monthly cron is plenty:

```cron
# 03:00 on the 1st of each month
0 3 1 * *  cd /srv/dubai-schools/ingestion && npm run ingest -- --source=dubaipulse >> ingest.log 2>&1
```

Every run writes a row to the `ingestion_runs` table (rows seen/upserted/skipped,
status, errors) for auditability.

## Extending

- **New source field?** Add header variants to `FIELD_ALIASES` in `mappings.ts`.
- **New curriculum/rating variant?** Extend `CURRICULUM_MAP` / `RATING_MAP`.
- **New source (e.g. a second portal)?** Implement the `SourceAdapter` interface
  in `src/sources/` and register it in `pickSource()`.

## Files

```
src/
  config.ts          env + endpoints
  types.ts           RawRow, CanonicalSchool, SourceAdapter
  mappings.ts        field aliases + value normalizers (the core logic)
  slug.ts            stable id generation
  normalize.ts       raw rows → canonical schools
  validate.ts        zod validation (+ coordinate sanity coercion)
  sources/
    dubaiPulse.ts    OAuth + paginated CKAN fetch
    csv.ts           CSV/spreadsheet fetch
  upsert.ts          scoped Supabase upsert + ingestion_runs audit
  index.ts           CLI orchestrator (describe / dry-run / ingest)
  mergeFees.ts       separate fees loader (never touched by KHDA sync)
sample/
  khda_sample.csv    messy KHDA-shaped sample
  fees_sample.csv    fees sample
```
