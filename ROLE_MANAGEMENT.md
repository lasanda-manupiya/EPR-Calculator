# Role management: Superadmin → Admin → Supplier

This project uses three roles in `public.company_admins.role`:

- `superadmin`: can create companies and promote users to `admin`.
- `admin`: can manage members in their company.
- `supplier`: supplier user under a company; can work on products but cannot manage users.

## 1) Registration rule (domain restricted)

`supabase/schema.sql` now enforces this at signup trigger level:

- Only users with email ending in `@sustainzone.co.uk` can register.
- Every newly-registered allowed user is automatically assigned `superadmin`.

If a non-`@sustainzone.co.uk` user signs up, signup is rejected with:

- `Only @sustainzone.co.uk users can register.`

## 2) Company must exist before making an admin

An admin row requires `company_id`, so the company must be created first.

Create company:

```sql
insert into public.companies (name, created_by)
values ('Acme Ltd', '<superadmin_user_uuid>')
returning id;
```

Then promote a user inside that company:

```sql
update public.company_admins ca
set role = 'admin'
from auth.users u
where ca.user_id = u.id
  and ca.company_id = '<company_uuid>'
  and lower(u.email) = 'admin-user@sustainzone.co.uk';
```

## 3) Add members (admin/superadmin workflow)

Suppliers should remain `supplier` role:

```sql
update public.company_admins ca
set role = 'supplier'
from auth.users u
where ca.user_id = u.id
  and ca.company_id = '<company_uuid>'
  and lower(u.email) = 'member-user@sustainzone.co.uk';
```

## 4) Optional one-time fix for existing records

If existing rows were created before this rule, normalize them:

```sql
update public.company_admins ca
set role = 'superadmin'
from auth.users u
where ca.user_id = u.id
  and lower(u.email) like '%@sustainzone.co.uk';
```

## 5) Grant super admin to requested user

Run this in Supabase SQL editor to grant super admin access to `lasanda@sustainzone.co.uk` across existing company memberships:

```sql
update public.company_admins ca
set role = 'superadmin'
from auth.users u
where ca.user_id = u.id
  and lower(u.email) = 'lasanda@sustainzone.co.uk';
```
