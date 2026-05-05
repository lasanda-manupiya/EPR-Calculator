create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null check (role in ('superadmin', 'admin', 'member')),
  status text not null default 'active' check (status in ('active', 'suspended', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reference_library (
  id uuid primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_settings (
  id text primary key default 'default',
  company_id uuid not null references public.companies(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table if exists public.company_admins rename to company_memberships_legacy;

create or replace function public.current_membership_role(target_company uuid)
returns text language sql stable as $$
  select cm.role
  from public.company_memberships cm
  where cm.user_id = auth.uid()
    and cm.company_id = target_company
    and cm.status = 'active'
  limit 1;
$$;

create or replace function public.is_superadmin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.company_memberships cm
    where cm.user_id = auth.uid() and cm.role = 'superadmin' and cm.status = 'active'
  );
$$;

create or replace function public.log_audit(p_company_id uuid, p_action text, p_target_type text, p_target_id text, p_metadata jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_logs (actor_user_id, company_id, action, target_type, target_id, metadata)
  values (auth.uid(), p_company_id, p_action, p_target_type, p_target_id, coalesce(p_metadata, '{}'::jsonb));
$$;

alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.products enable row level security;
alter table public.reference_library enable row level security;
alter table public.company_settings enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists companies_select on public.companies;
drop policy if exists companies_insert on public.companies;
drop policy if exists companies_update on public.companies;
drop policy if exists memberships_select on public.company_memberships;
drop policy if exists memberships_insert on public.company_memberships;
drop policy if exists memberships_update on public.company_memberships;
drop policy if exists products_select on public.products;
drop policy if exists products_insert on public.products;
drop policy if exists products_update on public.products;
drop policy if exists products_delete on public.products;
drop policy if exists ref_select on public.reference_library;
drop policy if exists ref_insert on public.reference_library;
drop policy if exists ref_update on public.reference_library;
drop policy if exists ref_delete on public.reference_library;
drop policy if exists settings_select on public.company_settings;
drop policy if exists settings_insert on public.company_settings;
drop policy if exists settings_update on public.company_settings;
drop policy if exists audit_select on public.audit_logs;

create policy companies_select on public.companies for select to authenticated using (
  public.is_superadmin() or id in (select company_id from public.company_memberships where user_id = auth.uid() and status = 'active')
);
create policy companies_insert on public.companies for insert to authenticated with check (public.is_superadmin());
create policy companies_update on public.companies for update to authenticated using (public.is_superadmin()) with check (public.is_superadmin());

create policy memberships_select on public.company_memberships for select to authenticated using (
  public.is_superadmin() or company_id in (select company_id from public.company_memberships where user_id = auth.uid() and status = 'active')
);
create policy memberships_insert on public.company_memberships for insert to authenticated with check (public.is_superadmin());
create policy memberships_update on public.company_memberships for update to authenticated using (
  public.is_superadmin() or public.current_membership_role(company_id) = 'admin'
) with check (
  public.is_superadmin() or public.current_membership_role(company_id) = 'admin'
);

create policy products_select on public.products for select to authenticated using (
  public.is_superadmin() or company_id in (select company_id from public.company_memberships where user_id = auth.uid() and status = 'active')
);
create policy products_insert on public.products for insert to authenticated with check (
  public.is_superadmin() or company_id in (select company_id from public.company_memberships where user_id = auth.uid() and status = 'active')
);
create policy products_update on public.products for update to authenticated using (
  public.is_superadmin() or company_id in (select company_id from public.company_memberships where user_id = auth.uid() and status = 'active')
) with check (
  public.is_superadmin() or company_id in (select company_id from public.company_memberships where user_id = auth.uid() and status = 'active')
);
create policy products_delete on public.products for delete to authenticated using (
  public.is_superadmin() or company_id in (select company_id from public.company_memberships where user_id = auth.uid() and status = 'active')
);

create policy ref_select on public.reference_library for select to authenticated using (
  public.is_superadmin() or company_id in (select company_id from public.company_memberships where user_id = auth.uid() and status = 'active')
);
create policy ref_insert on public.reference_library for insert to authenticated with check (
  public.is_superadmin() or public.current_membership_role(company_id) = 'admin'
);
create policy ref_update on public.reference_library for update to authenticated using (
  public.is_superadmin() or public.current_membership_role(company_id) = 'admin'
) with check (
  public.is_superadmin() or public.current_membership_role(company_id) = 'admin'
);
create policy ref_delete on public.reference_library for delete to authenticated using (
  public.is_superadmin() or public.current_membership_role(company_id) = 'admin'
);

create policy settings_select on public.company_settings for select to authenticated using (
  public.is_superadmin() or company_id in (select company_id from public.company_memberships where user_id = auth.uid() and status = 'active')
);
create policy settings_insert on public.company_settings for insert to authenticated with check (
  public.is_superadmin() or public.current_membership_role(company_id) = 'admin'
);
create policy settings_update on public.company_settings for update to authenticated using (
  public.is_superadmin() or public.current_membership_role(company_id) = 'admin'
) with check (
  public.is_superadmin() or public.current_membership_role(company_id) = 'admin'
);

create policy audit_select on public.audit_logs for select to authenticated using (
  public.is_superadmin() or company_id in (select company_id from public.company_memberships where user_id = auth.uid() and status = 'active')
);

create or replace function public.create_company_with_admin(company_name text, admin_email text, admin_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  created_company uuid;
begin
  if not public.is_superadmin() then
    raise exception 'Only superadmins can create companies';
  end if;
  insert into public.companies(name, created_by) values (company_name, auth.uid()) returning id into created_company;
  insert into public.company_memberships(company_id, email, full_name, role, status, user_id)
  values (created_company, lower(admin_email), admin_name, 'admin', 'active', auth.uid())
  on conflict do nothing;
  perform public.log_audit(created_company, 'create_company_with_admin', 'company', created_company::text, jsonb_build_object('admin_email', lower(admin_email), 'admin_name', admin_name));
  return created_company;
end;
$$;

create or replace function public.invite_user_to_company(p_company_id uuid, p_email text, p_role text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  membership_id uuid;
  caller_role text;
begin
  caller_role := public.current_membership_role(p_company_id);
  if not (public.is_superadmin() or caller_role = 'admin') then
    raise exception 'Not authorized';
  end if;
  if p_role not in ('admin','member') then raise exception 'Invalid role'; end if;
  insert into public.company_memberships(company_id, email, role, status)
  values (p_company_id, lower(p_email), p_role, 'active')
  returning id into membership_id;
  perform public.log_audit(p_company_id, 'invite_user_to_company', 'membership', membership_id::text, jsonb_build_object('email', lower(p_email), 'role', p_role));
  return membership_id;
end;
$$;

create or replace function public.update_membership_status(p_company_id uuid, p_user_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_superadmin() or public.current_membership_role(p_company_id) = 'admin') then raise exception 'Not authorized'; end if;
  if p_status not in ('active','suspended','removed') then raise exception 'Invalid status'; end if;
  update public.company_memberships set status = p_status, updated_at = now() where company_id = p_company_id and user_id = p_user_id;
  perform public.log_audit(p_company_id, 'update_membership_status', 'membership', p_user_id::text, jsonb_build_object('status', p_status));
end;
$$;

create or replace function public.change_membership_role(p_company_id uuid, p_user_id uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_superadmin() or public.current_membership_role(p_company_id) = 'admin') then raise exception 'Not authorized'; end if;
  if p_role not in ('admin','member') then raise exception 'Invalid role'; end if;
  update public.company_memberships set role = p_role, updated_at = now() where company_id = p_company_id and user_id = p_user_id;
  perform public.log_audit(p_company_id, 'change_membership_role', 'membership', p_user_id::text, jsonb_build_object('role', p_role));
end;
$$;
