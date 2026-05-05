# SustainZone EPR Packaging Estimation MVP

Frontend app built with React + TypeScript + Vite + Tailwind CSS.

## Run locally

```bash
npm install
npm run dev
```

## Optional shared database mode (Supabase)

Create `.env`:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

If these variables are missing, the app automatically uses localStorage.

## Deployment guide

See `PRODUCTION_DEPLOYMENT.md` for free production deployment steps (Supabase + Vercel).

## Role management

See `ROLE_MANAGEMENT.md` for setting up `superadmin`, `admin`, and `member` roles in Supabase.
