create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reference_library (
  id uuid primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_settings (
  id text primary key default 'default',
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

create policy "Allow read/write with anon key" on public.products for all using (true) with check (true);
create policy "Allow read/write with anon key" on public.reference_library for all using (true) with check (true);
create policy "Allow read/write with anon key" on public.company_settings for all using (true) with check (true);

-- Keep these read-only from the client; population is handled by DB trigger.
create policy "Authenticated users can read companies" on public.companies
for select to authenticated using (true);

create policy "Authenticated users can read company admins" on public.company_admins
for select to authenticated using (true);

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
begin
  target_company := nullif(trim(coalesce(new.raw_user_meta_data ->> 'company_name', '')), '');
  target_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'name', '')), '');

  if target_company is null then
    target_company := 'Unassigned Company';
  end if;

  insert into public.companies (name, created_by)
  values (target_company, new.id)
  on conflict (name) do update set name = excluded.name
  returning id into created_company_id;

  if lower(new.email) not like '%@sustainzone.co.uk' then
    raise exception 'Only @sustainzone.co.uk users can register.';
  end if;

  insert into public.company_admins (company_id, user_id, full_name, role)
  values (
    created_company_id,
    new.id,
    target_name,
    'superadmin'
  )
  on conflict (company_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();
