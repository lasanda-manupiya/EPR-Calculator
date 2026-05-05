# Role Management (MVP Multi-tenant)

## Roles
- `superadmin` (platform): create companies and assign first admin.
- `admin` (company): invite/manage users in own company only.
- `member` (company): no user-management permissions.

## Membership model
- Table: `company_memberships`
- Role: `superadmin|admin|member`
- Status: `active|suspended|removed`

## Secure workflows (RPC)
- `create_company_with_admin(company_name, admin_email, admin_name)`
- `invite_user_to_company(company_id, email, role)`
- `update_membership_status(company_id, user_id, status)`
- `change_membership_role(company_id, user_id, role)`

All functions enforce authorization and write `audit_logs` entries.

## Operations checklist
1. **Onboard company**: superadmin runs create-company flow and sets first admin email.
2. **Invite users**: company admin uses Access Management to invite admin/member users.
3. **Offboard users**: set status to `suspended` then `removed` after transfer checks.
4. **Incident rollback**: review `audit_logs`, revert membership role/status, and rotate impacted sessions.
