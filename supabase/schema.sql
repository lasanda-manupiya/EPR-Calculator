create extension if not exists pgcrypto;

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
  role text not null default 'supplier' check (role in ('superadmin', 'admin', 'supplier')),
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create table if not exists public.invited_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  role text not null check (role in ('admin','supplier')),
  company_id uuid references public.companies(id) on delete cascade,
  invited_company_name text,
  invited_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','accepted','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  company_id uuid not null references public.companies(id) on delete cascade
);
create table if not exists public.reference_library (
  id uuid primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  company_id uuid references public.companies(id) on delete cascade
);
create table if not exists public.company_settings (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  company_id uuid not null unique references public.companies(id) on delete cascade
);

create or replace function public.is_superadmin() returns boolean language sql stable as $$
  select exists (select 1 from public.company_admins where user_id = auth.uid() and role='superadmin');
$$;
create or replace function public.can_access_company(target_company_id uuid) returns boolean language sql stable as $$
  select public.is_superadmin() or exists (select 1 from public.company_admins where user_id = auth.uid() and company_id=target_company_id);
$$;

alter table public.companies enable row level security;
alter table public.company_admins enable row level security;
alter table public.invited_users enable row level security;
alter table public.products enable row level security;
alter table public.reference_library enable row level security;
alter table public.company_settings enable row level security;

drop policy if exists p_companies_select on public.companies;
create policy p_companies_select on public.companies for select to authenticated using (public.can_access_company(id));
create policy p_companies_insert on public.companies for insert to authenticated with check (public.is_superadmin());

drop policy if exists p_company_admins_select on public.company_admins;
create policy p_company_admins_select on public.company_admins for select to authenticated using (public.can_access_company(company_id));
create policy p_company_admins_write on public.company_admins for all to authenticated using (public.can_access_company(company_id)) with check (public.can_access_company(company_id));

create policy p_products_all on public.products for all to authenticated using (public.can_access_company(company_id)) with check (public.can_access_company(company_id));
create policy p_settings_all on public.company_settings for all to authenticated using (public.can_access_company(company_id)) with check (public.can_access_company(company_id));
create policy p_reference_read on public.reference_library for select to authenticated using (company_id is null or public.can_access_company(company_id));
create policy p_reference_write on public.reference_library for all to authenticated using (public.can_access_company(company_id)) with check (public.can_access_company(company_id));
create policy p_invited_select on public.invited_users for select to authenticated using (public.is_superadmin() or public.can_access_company(company_id));
create policy p_invited_write on public.invited_users for all to authenticated using (public.is_superadmin() or public.can_access_company(company_id)) with check (public.is_superadmin() or public.can_access_company(company_id));

create or replace function public.invite_company_user(p_email text,p_full_name text,p_role text,p_company_id uuid,p_company_name text default null)
returns void language plpgsql security definer set search_path=public as $$
declare v_role text := lower(p_role); v_company_id uuid := p_company_id; v_exists int;
begin
  if v_role not in ('admin','supplier') then raise exception 'Not allowed role'; end if;
  if not public.is_superadmin() and v_role='admin' then raise exception 'Not allowed'; end if;
  if not public.is_superadmin() and p_company_id is null then raise exception 'company required'; end if;
  if public.is_superadmin() and v_role='admin' and v_company_id is null then
    insert into public.companies(name, created_by) values (trim(p_company_name), auth.uid()) returning id into v_company_id;
  end if;
  if v_company_id is null then raise exception 'company required'; end if;
  if not public.can_access_company(v_company_id) then raise exception 'permission denied for company'; end if;

  select count(*) into v_exists from auth.users where lower(email)=lower(p_email);
  if v_exists > 0 then raise exception 'email already exists'; end if;

  insert into public.invited_users(email,full_name,role,company_id,invited_company_name,invited_by,status)
  values(lower(p_email), nullif(trim(p_full_name),''), v_role, v_company_id, p_company_name, auth.uid(), 'pending')
  on conflict (email) do update set role=excluded.role,company_id=excluded.company_id,full_name=excluded.full_name,status='pending',updated_at=now();
end;
$$;

create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path=public as $$
declare inv record;
begin
  select * into inv from public.invited_users where lower(email)=lower(new.email) and status='pending';
  if found then
    insert into public.company_admins(company_id,user_id,full_name,role)
    values(inv.company_id,new.id,coalesce(inv.full_name, new.raw_user_meta_data->>'name'),inv.role)
    on conflict (company_id,user_id) do update set role=excluded.role, full_name=excluded.full_name;
    update public.invited_users set status='accepted',updated_at=now() where id=inv.id;
    return new;
  end if;
  if lower(new.email) like '%@sustainzone.co.uk' then
    insert into public.companies(name,created_by) values(split_part(new.email,'@',1)||' Company',new.id) on conflict(name) do update set name=excluded.name returning id into inv.company_id;
    insert into public.company_admins(company_id,user_id,full_name,role) values(inv.company_id,new.id,new.raw_user_meta_data->>'name','superadmin') on conflict do nothing;
    return new;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_auth_user();
