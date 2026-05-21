# Role management: Superadmin → Admin → Supplier

Roles are stored in `public.company_admins.role`.

## Multi-tenant rules
- `superadmin`: can access all companies, create companies, invite admin/supplier users.
- `admin`: can invite supplier users only in their active company.
- `supplier`: product/settings/report access in mapped company only.

## Invitation flow (no silent failure)
1. Access Management calls `public.invite_company_user(...)`.
2. This stores pending records in `public.invited_users`.
3. User accepts invite/signs up in Supabase Auth.
4. Trigger `public.handle_new_auth_user()` maps user to `company_admins` and marks invitation as `accepted`.

If a user appears as pending, they have not finished auth signup/acceptance yet.
