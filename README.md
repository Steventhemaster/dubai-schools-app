# Dubai Schools 🏫

A community-driven mobile app for **finding and reviewing schools in Dubai** —
fees, vacancy, KHDA rating, nationality mix, admissions notes, and parent
reviews with star ratings. This is **Phase 1 (MVP)** of a broader Dubai
residents' community super-app (real estate, marketplace, community boards).

Built with **React Native + Expo (TypeScript)**, **Expo Router**, and
**Supabase**. English-first with a fully wired **i18n layer (Arabic ready, RTL-aware)**.

---

## ✨ What's in the MVP

| Feature | Status |
|---|---|
| School directory with search | ✅ |
| Filters: curriculum, area, vacancy + sort (rating/fees) | ✅ |
| School detail: Overview / Admissions / Fees / Reviews | ✅ |
| Fees by grade, nationality mix bars, KHDA rating | ✅ |
| Vacancy status + admissions notes | ✅ |
| ⭐ Star ratings & parent reviews (read + write) | ✅ |
| Save / bookmark schools | ✅ |
| Language switch (EN / العربية) | ✅ |
| Auth (email/password), review sign-in gate, account deletion | ✅ |
| Report/flag reviews + moderation schema (App Store 1.2) | ✅ |
| Supabase backend + RLS + offline demo fallback | ✅ |
| 🌙 Automatic dark mode (system appearance) | ✅ |
| Modern UI: icon tab bar, skeleton loaders, pull-to-refresh | ✅ |
| "Top rated" horizontal rail + sort (rating / fees) | ✅ |
| App Store–style rating distribution bars | ✅ |
| Sticky bottom CTA bar + native share on school detail | ✅ |

> The app runs **fully offline in demo mode** with bundled seed data until you
> connect Supabase — great for screenshots and store review.

---

## 🚀 Quick start

```bash
cd dubai-schools-app
npm install
npm start        # then press i (iOS), a (Android), or w (web)
```

No backend needed to try it — it falls back to seed data automatically.

### Connect Supabase (optional for MVP, required for real data)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Copy `.env.example` → `.env` and fill in:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
4. Restart `npm start`. The Profile tab shows 🟢 *Connected*.

---

## 🗂 Project structure

```
app/                       # Expo Router screens (file-based routing)
  _layout.tsx              # Root stack + providers (i18n, saved-schools)
  (tabs)/                  # Tab navigator
    index.tsx              # School list + search + filters
    saved.tsx              # Bookmarked schools
    profile.tsx            # Language switch, backend status
  school/[id].tsx          # School detail (4 tabs)
  school/review/[id].tsx   # Write-a-review modal
src/
  components/              # SchoolCard, RatingStars, Badge, FilterChips, ...
  lib/                     # types, supabase client, repository, format helpers
  i18n/                    # i18next setup + en/ar locale files
  data/                    # seed schools & reviews (offline fallback)
  theme/                   # design tokens (Dubai marine-blue + desert-gold)
supabase/
  schema.sql               # tables, enums, aggregate view, RLS policies
  seed.sql                 # demo schools + reviews
  migrations/
    0002_provenance.sql    # source-tracking columns + ingestion audit log
ingestion/                 # KHDA → Supabase data pipeline (own package)
  src/                     # adapters, normalize, validate, upsert, CLI
  sample/                  # messy CSV samples for credential-free testing
docs/
  PRODUCT.md               # product spec, personas, roadmap (Phases 2–4)
```

The **repository layer** (`src/lib/repository.ts`) is the only thing the UI
talks to. Swapping demo data for Supabase is transparent to every screen.

---

## 📡 Real data — KHDA ingestion pipeline

Real school data is loaded by the pipeline in [`ingestion/`](ingestion/README.md),
which pulls from **[Dubai Pulse](https://www.dubaipulse.gov.ae) — the official
KHDA open dataset** (name, area, curriculum, inspection rating, enrolment,
capacity), normalizes the messy government data, validates it, and upserts into
Supabase with full source-tracking.

```bash
cd ingestion && npm install
npm run ingest -- --source=csv --dry-run   # works with zero credentials (sample data)
```

Fees aren't in the KHDA open data, so they're layered on by a separate
`merge:fees` step and labelled with their own source. Each school shows
**"Official KHDA open data" + last-updated** in the app (see the Overview tab).

## ⚠️ Data disclaimer

The **seed** figures bundled for demo mode are illustrative placeholders. The
ingestion pipeline replaces them with authoritative KHDA data; fees remain
community/prospectus-sourced and are labelled as such. Always keep the
"data source / last updated" provenance visible (already implemented).

---

## 🧭 Roadmap (see `docs/PRODUCT.md`)

- **Phase 2** — RERA-backed rentals/sale prices, community living info, marts
- **Phase 3** — Marketplace + interior ideas (오늘의집-style), classifieds
- **Phase 4** — Community boards, announcements, neighbour Q&A

---

## 🛠 Scripts

- `npm start` — Expo dev server
- `npm run ios` / `npm run android` / `npm run web`
- `npm run typecheck` — TypeScript check
