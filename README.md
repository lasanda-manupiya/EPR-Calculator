# EPR Calculator

## Production-safe tenancy + access model (MVP)

This app uses explicit role-based, multi-tenant access control with Supabase RLS:
- Platform `superadmin`
- Company `admin`
- Company `member`

No role is inferred from email domain.

## Setup
1. Apply `supabase/schema.sql` in Supabase SQL editor.
2. Ensure auth users are invited through your auth workflow.
3. Use the app pages:
   - `/superadmin/companies` for platform company onboarding
   - `/access-management` for company-level invites and role/status management
4. Validate with `supabase/verify_role_boundaries.sql`.

## Security notes
- Sensitive actions are executed via RPC functions with authorization checks.
- Every sensitive action writes to `audit_logs`.
- Service role keys remain backend-only.
