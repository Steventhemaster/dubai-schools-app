# Deploy the web app to DigitalOcean App Platform

The Expo web build is a static site (`dist/`). DO App Platform hosts it free,
with automatic HTTPS + CDN and auto-redeploy on every GitHub push.

## What's already done
- `npx expo export -p web` builds cleanly → `dist/` (verified).
- Supabase URL + anon key are baked into the bundle at build time.
- `.do/app.yaml` holds the App Platform spec.

## Step 1 — Push the code to GitHub
The repo is already `git init`'d and committed locally. Create an empty repo on
GitHub (no README), then:

```bash
cd dubai-schools-app
git remote add origin https://github.com/<you>/dubai-schools-app.git
git branch -M main
git push -u origin main
```

> `.env`, `node_modules/`, `dist/`, and the service-role key are gitignored —
> only safe, public files are pushed.

## Step 2 — Create the App Platform app

### Option A — Web UI (easiest)
1. DigitalOcean → **Apps → Create App → GitHub** → pick your repo, branch `main`.
2. DO detects a **Static Site**. Set:
   - **Build command:** `npx expo export -p web`
   - **Output directory:** `dist`
   - **Catchall document:** `index.html`  ← critical for `/school/<id>` deep links
3. **Environment variables** (Build-time):
   - `EXPO_PUBLIC_SUPABASE_URL` = `https://dmifcaxitaqdeojgnfci.supabase.co`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = `eyJ…` (the anon key — public, safe)
4. **Region:** Frankfurt (closest to Dubai). Plan: **Static Site = $0**.
5. Create → wait ~3–5 min for the first build. You get a URL like
   `https://dubai-schools-xxxxx.ondigitalocean.app`.

### Option B — doctl CLI
```bash
# edit .do/app.yaml → set github.repo to "<you>/dubai-schools-app" first
doctl apps create --spec .do/app.yaml
```

## Step 3 — Point Supabase Auth at the deployed URL
So sign-up confirmation links and redirects work:
- Supabase → **Authentication → URL Configuration**
  - **Site URL:** `https://<your-app>.ondigitalocean.app`
  - **Redirect URLs:** add the same URL
- (Optional for testing) **Authentication → Providers → Email** → turn off
  "Confirm email" so new accounts work without an inbox round-trip.

## Updating later
Every `git push` to `main` triggers an automatic rebuild + redeploy. No data is
affected — schools/reviews live in Supabase, not in the deploy.

## Notes
- Schools data is served from Supabase at runtime, so the deployed site shows
  the same 226 live schools.
- The service-role key is NEVER deployed — it lives only in `ingestion/.env`
  on your machine for the data pipeline.
- Custom domain: App Platform → Settings → Domains (free, auto-TLS).
