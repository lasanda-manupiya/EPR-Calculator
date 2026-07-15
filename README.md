# SustainZone EPR Packaging Estimation

Frontend app built with React + TypeScript + Vite + Tailwind, backed by Supabase
(Postgres + Auth) and deployed on Vercel.

## What it does
Estimate packaging weights for EPR reporting. Users register a company (or join
one with an invite code), enter products, and the app estimates packaging weight
against a shared reference library.

## Access model (short version)
- **superadmin** (one locked account) — sees all companies.
- **admin** — first person to register a company; manages members & invite codes.
- **member** — joins via an invite code; shares company data.

Products/reports are **company-scoped**. Packaging-library additions are
**private per user**, on top of a shared default library you can hide/restore.
Full details in [`ROLE_MANAGEMENT.md`](ROLE_MANAGEMENT.md).

## Run locally
```bash
npm install
cp .env.example .env   # then fill in your Supabase URL + anon key
npm run dev
```
If the Supabase variables are missing, the app falls back to browser localStorage
(single-user, no cloud sync).

## Deploy / connect Supabase & Vercel
See [`SETUP.md`](SETUP.md) for the step-by-step checklist (migration, email
verification, superadmin creation, env vars).

## Security notes
- Row-Level Security enforces all tenant isolation in Postgres — the client
  cannot bypass it.
- Registration logic runs in `SECURITY DEFINER` database functions.
- Email verification is required before the app is usable.
- The `service_role` key is never used client-side.
