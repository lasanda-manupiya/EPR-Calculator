create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key,
  company_id uuid references public.companies(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reference_library (
  id uuid primary key,
  company_id uuid references public.companies(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_settings (
  id text primary key default 'default',
  company_id uuid references public.companies(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

-- Multi-tenant onboarding tables for companies/admin mappings.
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.company_admins (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'member' check (role in ('superadmin', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

alter table public.products add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.reference_library add column if not exists company_id uuid references public.companies(id) on delete cascade;
alter table public.company_settings add column if not exists company_id uuid references public.companies(id) on delete cascade;

alter table public.products enable row level security;
alter table public.reference_library enable row level security;
alter table public.company_settings enable row level security;
alter table public.companies enable row level security;
alter table public.company_admins enable row level security;

drop policy if exists "Allow read/write with anon key" on public.products;
drop policy if exists "Allow read/write with anon key" on public.reference_library;
drop policy if exists "Allow read/write with anon key" on public.company_settings;
drop policy if exists "Allow read/write with anon key" on public.companies;
drop policy if exists "Allow read/write with anon key" on public.company_admins;

drop policy if exists "Authenticated users can read companies" on public.companies;
drop policy if exists "Authenticated users can read company admins" on public.company_admins;

create or replace function public.is_superadmin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.company_admins ca
    where ca.user_id = auth.uid() and ca.role = 'superadmin'
  );
$$;

create or replace function public.is_admin_or_superadmin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.company_admins ca
    where ca.user_id = auth.uid() and ca.role in ('superadmin', 'admin')
  );
$$;

create or replace function public.is_root_admin_email()
returns boolean language sql stable as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'admin@sustainzone.co.uk';
$$;

create policy "Products by company, superadmin sees all" on public.products
for all to authenticated
using (
  public.is_superadmin() or company_id in (
    select ca.company_id from public.company_admins ca where ca.user_id = auth.uid()
  )
)
with check (
  public.is_superadmin() or company_id in (
    select ca.company_id from public.company_admins ca where ca.user_id = auth.uid()
  )
);

create policy "Reference library read by company, superadmin sees all" on public.reference_library
for select to authenticated
using (
  public.is_superadmin() or company_id in (
    select ca.company_id from public.company_admins ca where ca.user_id = auth.uid()
  )
);

create policy "Reference library write only root admin" on public.reference_library
for insert to authenticated
with check (
  public.is_root_admin_email() and (
    public.is_superadmin() or company_id in (
      select ca.company_id from public.company_admins ca where ca.user_id = auth.uid()
    )
  )
);

create policy "Reference library update only root admin" on public.reference_library
for update to authenticated
using (public.is_root_admin_email())
with check (public.is_root_admin_email());

create policy "Reference library delete only root admin" on public.reference_library
for delete to authenticated
using (public.is_root_admin_email());

create policy "Settings by company, superadmin sees all" on public.company_settings
for all to authenticated
using (
  public.is_superadmin() or company_id in (
    select ca.company_id from public.company_admins ca where ca.user_id = auth.uid()
  )
)
with check (
  public.is_superadmin() or company_id in (
    select ca.company_id from public.company_admins ca where ca.user_id = auth.uid()
  )
);

create policy "Companies visible to own company and superadmin" on public.companies
for select to authenticated using (
  public.is_superadmin() or id in (select ca.company_id from public.company_admins ca where ca.user_id = auth.uid())
);

create policy "Only superadmin can create companies" on public.companies
for insert to authenticated with check (public.is_superadmin());

create policy "Company admins visible to same company and superadmin" on public.company_admins
for select to authenticated using (
  public.is_superadmin() or company_id in (select ca.company_id from public.company_admins ca where ca.user_id = auth.uid())
);

create policy "Only superadmin can promote/create admins" on public.company_admins
for insert to authenticated with check (public.is_superadmin());

create policy "Admin can add members in own company" on public.company_admins
for update to authenticated
using (
  company_id in (select ca.company_id from public.company_admins ca where ca.user_id = auth.uid() and ca.role in ('admin','superadmin'))
)
with check (
  (
    public.is_superadmin()
    and role in ('superadmin','admin','member')
  )
  or (
    company_id in (select ca.company_id from public.company_admins ca where ca.user_id = auth.uid() and ca.role = 'admin')
    and role = 'member'
  )
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_company text;
  target_name text;
  created_company_id uuid;
  invited_company_id uuid;
  invited_role text;
begin
  invited_company_id := nullif(new.raw_user_meta_data ->> 'invited_company_id', '')::uuid;
  invited_role := lower(coalesce(new.raw_user_meta_data ->> 'invited_role', 'member'));

  target_company := nullif(trim(coalesce(new.raw_user_meta_data ->> 'company_name', '')), '');
  target_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'name', '')), '');

  if lower(new.email) like '%@sustainzone.co.uk' then
    if target_company is null then
      target_company := split_part(new.email, '@', 1) || ' Company';
    end if;

    insert into public.companies (name, created_by)
    values (target_company, new.id)
    on conflict (name) do update set name = excluded.name
    returning id into created_company_id;

    insert into public.company_admins (company_id, user_id, full_name, role)
    values (created_company_id, new.id, target_name, 'superadmin')
    on conflict (company_id, user_id) do nothing;

    return new;
  end if;

  if invited_company_id is null then
    raise exception 'Non-sustainzone users must be invited to an existing company.';
  end if;

  if invited_role not in ('admin', 'member') then
    invited_role := 'member';
  end if;

  insert into public.company_admins (company_id, user_id, full_name, role)
  values (invited_company_id, new.id, target_name, invited_role)
  on conflict (company_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();
