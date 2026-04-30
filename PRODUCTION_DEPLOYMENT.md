# Production Deployment Guide (Free Tier)

This project can be deployed for free using **Supabase (database)** + **Vercel (hosting)**.

## 1) Architecture
- Frontend: React + Vite app hosted on Vercel.
- Database: Supabase Postgres tables storing products, reference library, and company settings.
- Fallback mode: If Supabase env vars are missing, app falls back to localStorage.

## 2) Create Supabase project (free)
1. Create a Supabase account and new project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. In Project Settings → API, copy:
   - `Project URL`
   - `anon public key`

## 3) Configure app env vars
Create `.env` locally for testing:

```bash
VITE_SUPABASE_URL=<your-project-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

## 4) Local production-like test
```bash
npm install
npm run build
npm run preview
```

Verify:
- Add product and refresh page (data persists).
- Edit packaging library and refresh.
- Save settings and refresh.

## 5) Deploy to Vercel (free)
1. Push this repo to GitHub.
2. In Vercel, import the repo.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Deploy.

## 6) Production hardening checklist
- Replace broad RLS policies with authenticated user/team-based policies.
- Enable Supabase Auth for real login instead of local demo auth.
- Add error monitoring (Sentry), uptime checks, and backup strategy.
- Configure a custom domain and enforce HTTPS.
- Add CI checks for `npm run build` before merges.

## 7) Operational notes for colleagues
- Share the Vercel URL.
- Any data created in app is shared through Supabase database.
- If Supabase is unavailable, app still works in localStorage mode for each browser independently.
