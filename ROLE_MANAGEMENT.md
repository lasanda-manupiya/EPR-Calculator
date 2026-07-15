# Roles & access model

Roles are stored in `public.company_members.role`. Each user belongs to exactly
one company (`unique (user_id)`).

## Roles
- **superadmin** — a single, locked account (`lasanda@sustainzone.co.uk`). Can read
  data across **all** companies (see the *Company Overview* page). The seat is
  granted once, by the DB trigger, only if no superadmin exists yet.
- **admin** — owns a company. Manages members and invite codes for that company;
  edits company settings.
- **member** — normal user. Shares product/report data with their company; keeps
  a private packaging-library of their own additions.

## How people get into a company (self-service)
1. **Start a company** — the first person registers with a *company name* and
   becomes its **admin**. Duplicate company names are rejected (so nobody can
   join your tenant just by guessing the name).
2. **Join with a code** — an admin generates an invite code
   (*Team & Invites* page → `create_invite_code` RPC) and shares it. New users
   enter the code on the registration screen; the `handle_new_auth_user` trigger
   validates it and adds them to the right company with the code's role.

All of this is enforced in Postgres (RLS policies + `SECURITY DEFINER` functions),
so the browser cannot bypass it.

## Data visibility
- **Products / reports / settings** → company-scoped (shared within a company).
- **Packaging library** → global defaults (shared, superadmin-managed) + each
  user's private additions + per-user hide/restore of defaults.
