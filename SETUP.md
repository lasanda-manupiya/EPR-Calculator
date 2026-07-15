# Setup & deployment

This is the checklist for wiring the app to your hosted Supabase project
(`clzwkajgzgkhweyurrmr`) and Vercel. The steps marked 🖱️ must be done by you in
the dashboards — they can't be automated from the codebase.

## 1. Apply the database migration

The schema lives in `supabase/migrations/20260715090000_epr_simplify.sql`.
Pick one:

- **GitHub integration (recommended):** 🖱️ Supabase Dashboard →
  *Project Settings → Integrations → GitHub* → connect this repo. From then on,
  every push to `main` runs new files in `supabase/migrations/` automatically.
- **CLI:** `npm i -g supabase` → `supabase login` → `supabase link --project-ref clzwkajgzgkhweyurrmr` → `supabase db push`.
- **Manual:** 🖱️ paste the migration file into *SQL Editor* and run it.

## 2. Turn on email verification

🖱️ Supabase → *Authentication → Providers → Email* → enable **Confirm email**.
🖱️ *Authentication → URL Configuration* → set the Site URL to your Vercel domain
so confirmation links point to the live app.

## 3. Create the superadmin account

The superadmin is locked to **lasanda@sustainzone.co.uk**. Create it once:

- 🖱️ Supabase → *Authentication → Users → Add user* → email
  `lasanda@sustainzone.co.uk`, set a password, tick *Auto Confirm*.

The `handle_new_auth_user` trigger grants the superadmin role automatically the
first time this account is created.

> ⚠️ The password you shared in chat should be treated as exposed. Set a fresh
> password here and rotate it after first login (Settings → Change password).

## 4. Frontend env vars

Locally: copy `.env.example` → `.env` and fill in `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` (Supabase → *Project Settings → API*).

🖱️ Vercel → your project → *Settings → Environment Variables* → add the same two
variables (Production + Preview). Redeploy.

The `service_role` key is **not** used by this app and must never be added to the
frontend or committed.

## 5. Verify

- Register a new company → confirm email → sign in → you're the **admin**.
- *Team & Invites* → generate a code → register a second user with it → they land
  in the same company as a **member** and share its products.
- Sign in as the superadmin → *Company Overview* shows every company's data.
