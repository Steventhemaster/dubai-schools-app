# Dubai Community Super-App — Product Spec

_Owner: Product Manager role · Updated 2026-06-11_

## 1. Vision

A trusted, community-built information hub for **living in Dubai** — starting
with schools, expanding into housing, neighbourhood living, and a local
marketplace. Think "the app every new Dubai family is told to download."

## 2. Why schools first (MVP wedge)

- **Acute, high-stakes need.** Choosing a school is the #1 stress for relocating
  families. Information today is scattered across school sites, KHDA PDFs, and
  Facebook/WhatsApp groups.
- **Clear data model.** Schools, fees, ratings, reviews — well-structured and
  defensible as a v1.
- **Natural virality.** Parents share school intel constantly; reviews create a
  content flywheel and a reason to return.
- **Bridges to later phases.** "Which area is this school in? What's rent like
  nearby?" → leads directly into Phase 2 (housing) and Phase 4 (community).

## 3. Target users / personas

| Persona | Need | Hook |
|---|---|---|
| **Relocating parent** (new to Dubai) | Compare schools by fee/curriculum/area, see if seats are open | Vacancy + fees + honest reviews |
| **Resident parent** (school switch) | Real parent experiences, KHDA trend | Reviews & ratings |
| **Community contributor** | Share knowledge, build reputation | Write reviews, add info |

## 4. MVP scope (Phase 1 — shipped)

- School directory + search + filters (curriculum, gender, vacancy)
- School profile: overview, admissions/vacancy, fees-by-grade, nationality mix,
  KHDA rating, contact links
- ⭐ Star ratings + written reviews (read & submit)
- Save/bookmark schools
- EN/AR localization scaffold (English-primary)
- Supabase backend with RLS; offline demo fallback

### Out of scope for v1 (deliberately)

- Accounts/social login (reviews are name-optional in demo; add Supabase Auth
  before enabling anonymous-write in production — see schema note)
- Map view, push notifications, in-app messaging

## 5. Success metrics (first 90 days post-launch)

- **Activation:** % of installs that open ≥3 school profiles
- **Contribution:** reviews submitted / WAU (target ≥ 3%)
- **Retention:** D30 retention ≥ 18% (info apps benchmark)
- **Coverage:** ≥ 150 Dubai schools with complete fee + KHDA data

## 6. Data strategy

1. **Seed** from public sources (KHDA inspection ratings, school fee pages).
2. **Crowd-correct** via "suggest an edit" (Phase 1.5).
3. **Verify** with a lightweight moderation queue before edits go live.
4. Always show **source + last-updated** per field to build trust.

> Compliance: avoid republishing copyrighted prospectus text verbatim; store
> factual data (fees, age range, ratings) with attribution. Reviews must have a
> report/flag path and clear UGC guidelines (UAE content laws apply).

## 7. Roadmap

### Phase 2 — Housing & neighbourhood (the big expansion)
- RERA-backed **sale prices & rent levels** by community/building
- "Living near this school": rent bands, commute, nearby supermarkets/clinics
- Area profiles: demographics, amenities, family-friendliness score

### Phase 3 — Marketplace & interiors
- Classifieds / second-hand (furniture, kids' items) — high churn in expat city
- **Interior ideas by home type** (villa/apartment), inspired by 오늘의집 (Ohou):
  photo feed → shoppable products → pro services

### Phase 4 — Community
- Neighbourhood boards, building/compound announcements
- Q&A ("best pediatric clinic in Dubai Hills?"), verified-resident badges

## 8. Tech & architecture

- **Client:** Expo (RN) + Expo Router, TypeScript, i18next.
- **Backend:** Supabase (Postgres + RLS + Auth + Storage + Realtime).
- **Repository pattern** isolates the UI from the data source, enabling the
  offline demo mode and a clean Supabase swap.
- **Scaling later:** Postgres full-text search → `pg_trgm`/`tsvector`;
  PostGIS for geo (areas, "schools near me"); Storage for school logos & review
  photos.

## 9. Open questions / decisions needed

- [ ] Auth model: email magic-link vs. UAE Pass integration?
- [ ] Review moderation: pre- vs. post-moderation at launch?
- [ ] Monetization: featured school listings? Lead-gen for admissions? (Keep
      neutral/trust-first in Phase 1.)
- [ ] Official data partnership (KHDA) vs. crowd-sourced only?
