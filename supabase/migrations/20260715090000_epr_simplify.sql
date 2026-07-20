-- ============================================================================
-- SustainZone EPR — simplified multi-tenant model
-- Roles: superadmin (locked to one email) | admin (owns a company) | member
-- Data: products/settings are company-scoped; library additions are per-user.
-- Security: Row-Level Security is the source of truth. The app layer only
-- mirrors these rules for UX — it cannot bypass them.
-- ============================================================================

create extension if not exists pgcrypto;

-- The one and only superadmin. Changing this string is the only way to move it.
create or replace function public.superadmin_email() returns text
language sql immutable as $$ select 'lasanda@sustainzone.co.uk'::text $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
create unique index if not exists companies_name_lower_idx on public.companies (lower(name));

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  consent_at timestamptz,             -- GDPR: when the privacy policy was accepted
  created_at timestamptz not null default now()
);

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'member' check (role in ('superadmin','admin','member')),
  created_at timestamptz not null default now(),
  unique (company_id, user_id),
  unique (user_id)                    -- each user belongs to exactly one company
);

create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null unique,
  role text not null default 'member' check (role in ('admin','member')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  max_uses int,                       -- null = unlimited
  used_count int not null default 0,
  active boolean not null default true
);

create table if not exists public.products (
  id uuid primary key,
  payload jsonb not null,
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

-- Global defaults have user_id IS NULL and are shared with everyone.
-- Personal additions have user_id = the owner and are private to them.
create table if not exists public.reference_library (
  id uuid primary key,
  payload jsonb not null,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Which global defaults a given user has hidden for themselves (restorable).
create table if not exists public.hidden_default_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so RLS policies don't recurse on
-- company_members, and so search_path is pinned against injection).
-- Drop first so re-running over an older schema (which used different
-- parameter names) can't fail with "cannot change name of input parameter".
-- ---------------------------------------------------------------------------
drop function if exists public.can_access_company(uuid) cascade;
drop function if exists public.is_superadmin() cascade;
drop function if exists public.is_company_admin(uuid) cascade;
drop function if exists public.my_company_id() cascade;

create or replace function public.is_superadmin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.company_members
    where user_id = auth.uid() and role = 'superadmin'
  );
$$;

create or replace function public.my_company_id() returns uuid
language sql stable security definer set search_path = public as $$
  select company_id from public.company_members where user_id = auth.uid() limit 1;
$$;

create or replace function public.can_access_company(target uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_superadmin() or exists (
    select 1 from public.company_members
    where user_id = auth.uid() and company_id = target
  );
$$;

create or replace function public.is_company_admin(target uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_superadmin() or exists (
    select 1 from public.company_members
    where user_id = auth.uid() and company_id = target and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table public.companies            enable row level security;
alter table public.profiles             enable row level security;
alter table public.company_members      enable row level security;
alter table public.invite_codes         enable row level security;
alter table public.products             enable row level security;
alter table public.company_settings     enable row level security;
alter table public.reference_library    enable row level security;
alter table public.hidden_default_items enable row level security;

-- profiles: you see/edit your own; superadmin sees all. Inserts via trigger only.
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_superadmin());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- companies: members of the company can read it; superadmin can do anything.
drop policy if exists companies_select on public.companies;
drop policy if exists companies_super_all on public.companies;
create policy companies_select on public.companies for select to authenticated
  using (public.can_access_company(id));
create policy companies_super_all on public.companies for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

-- company_members: readable by company; admins manage members (not superadmins).
drop policy if exists members_select on public.company_members;
drop policy if exists members_delete on public.company_members;
drop policy if exists members_update on public.company_members;
drop policy if exists members_super_insert on public.company_members;
create policy members_select on public.company_members for select to authenticated
  using (public.can_access_company(company_id));
create policy members_delete on public.company_members for delete to authenticated
  using (public.is_company_admin(company_id) and role <> 'superadmin');
create policy members_update on public.company_members for update to authenticated
  using (public.is_company_admin(company_id) and role <> 'superadmin')
  with check (public.is_company_admin(company_id) and role <> 'superadmin');
create policy members_super_insert on public.company_members for insert to authenticated
  with check (public.is_superadmin());

-- invite_codes: company-visible; only company admins manage.
drop policy if exists invites_select on public.invite_codes;
drop policy if exists invites_write on public.invite_codes;
create policy invites_select on public.invite_codes for select to authenticated
  using (public.can_access_company(company_id));
create policy invites_write on public.invite_codes for all to authenticated
  using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

-- products: company-scoped (everyone in the company shares them).
drop policy if exists products_all on public.products;
create policy products_all on public.products for all to authenticated
  using (public.can_access_company(company_id))
  with check (public.can_access_company(company_id));

-- company_settings: readable by company, writable by admins.
drop policy if exists settings_select on public.company_settings;
drop policy if exists settings_write on public.company_settings;
create policy settings_select on public.company_settings for select to authenticated
  using (public.can_access_company(company_id));
create policy settings_write on public.company_settings for all to authenticated
  using (public.is_company_admin(company_id)) with check (public.is_company_admin(company_id));

-- reference_library: globals (user_id null) are world-readable but only the
-- superadmin can write them; personal rows are private to their owner.
drop policy if exists library_select on public.reference_library;
drop policy if exists library_insert on public.reference_library;
drop policy if exists library_update on public.reference_library;
drop policy if exists library_delete on public.reference_library;
create policy library_select on public.reference_library for select to authenticated
  using (user_id is null or user_id = auth.uid() or public.is_superadmin());
create policy library_insert on public.reference_library for insert to authenticated
  with check (user_id = auth.uid() or (user_id is null and public.is_superadmin()));
create policy library_update on public.reference_library for update to authenticated
  using (user_id = auth.uid() or (user_id is null and public.is_superadmin()))
  with check (user_id = auth.uid() or (user_id is null and public.is_superadmin()));
create policy library_delete on public.reference_library for delete to authenticated
  using (user_id = auth.uid() or (user_id is null and public.is_superadmin()));

-- hidden_default_items: strictly your own.
drop policy if exists hidden_all on public.hidden_default_items;
create policy hidden_all on public.hidden_default_items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Registration: create profile + company/membership when a new auth user is
-- inserted. All privileged logic lives here (server-side, tamper-proof).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_company_name text := nullif(trim(new.raw_user_meta_data->>'company_name'), '');
  v_full_name    text := nullif(trim(new.raw_user_meta_data->>'full_name'), '');
  v_invite_code  text := nullif(trim(new.raw_user_meta_data->>'invite_code'), '');
  v_company_id   uuid;
  inv            record;
begin
  insert into public.profiles (id, email, full_name, consent_at)
  values (
    new.id, lower(new.email), v_full_name,
    case when (new.raw_user_meta_data->>'gdpr_consent') = 'true' then now() else null end
  )
  on conflict (id) do nothing;

  -- Locked superadmin (only if the seat is still empty).
  if lower(new.email) = public.superadmin_email() then
    if not exists (select 1 from public.company_members where role = 'superadmin') then
      insert into public.companies (name, created_by)
      values (coalesce(v_company_name, 'SustainZone'), new.id)
      returning id into v_company_id;
      insert into public.company_members (company_id, user_id, full_name, role)
      values (v_company_id, new.id, v_full_name, 'superadmin');
      return new;
    end if;
  end if;

  -- Join an existing company via invite code.
  if v_invite_code is not null then
    select * into inv from public.invite_codes
      where code = v_invite_code and active
        and (expires_at is null or expires_at > now())
        and (max_uses is null or used_count < max_uses)
      for update;
    if found then
      insert into public.company_members (company_id, user_id, full_name, role)
      values (inv.company_id, new.id, v_full_name, inv.role)
      on conflict (user_id) do nothing;
      update public.invite_codes set used_count = used_count + 1 where id = inv.id;
    end if;
    -- Invalid/expired codes leave the user without a company; the app guides them.
    return new;
  end if;

  -- Otherwise: register a brand-new company and become its admin.
  -- A duplicate company name is rejected (prevents joining someone else's tenant).
  if v_company_name is not null then
    begin
      insert into public.companies (name, created_by)
      values (v_company_name, new.id)
      returning id into v_company_id;
      insert into public.company_members (company_id, user_id, full_name, role)
      values (v_company_id, new.id, v_full_name, 'admin');
    exception when unique_violation then
      null; -- name taken: leave without company, app tells them to request an invite
    end;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Public RPCs used by the (unauthenticated) registration screen.
-- ---------------------------------------------------------------------------
create or replace function public.company_name_available(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (
    select 1 from public.companies where lower(name) = lower(trim(p_name))
  );
$$;

create or replace function public.preview_invite_code(p_code text)
returns table(valid boolean, company_name text, member_role text)
language sql stable security definer set search_path = public as $$
  select
    (ic.active
      and (ic.expires_at is null or ic.expires_at > now())
      and (ic.max_uses is null or ic.used_count < ic.max_uses)) as valid,
    c.name as company_name,
    ic.role as member_role
  from public.invite_codes ic
  join public.companies c on c.id = ic.company_id
  where ic.code = trim(p_code)
  limit 1;
$$;

grant execute on function public.company_name_available(text) to anon, authenticated;
grant execute on function public.preview_invite_code(text)    to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin RPC: mint an invite code for the caller's own company.
-- ---------------------------------------------------------------------------
create or replace function public.create_invite_code(
  p_role text default 'member',
  p_expires_at timestamptz default null,
  p_max_uses int default null
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_company uuid := public.my_company_id();
  v_code text;
begin
  if v_company is null then raise exception 'You are not part of a company yet.'; end if;
  if not public.is_company_admin(v_company) then
    raise exception 'Only company admins can create invite codes.';
  end if;
  if p_role not in ('admin','member') then raise exception 'Invalid role.'; end if;
  if p_role = 'admin' and not public.is_superadmin() then
    raise exception 'Only the superadmin can invite admins.';
  end if;
  -- gen_random_uuid() is built-in (pg_catalog); avoids pgcrypto/search_path issues.
  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.invite_codes (company_id, code, role, created_by, expires_at, max_uses)
  values (v_company, v_code, p_role, auth.uid(), p_expires_at, p_max_uses);
  return v_code;
end;
$$;
grant execute on function public.create_invite_code(text, timestamptz, int) to authenticated;

-- ---------------------------------------------------------------------------
-- GDPR erasure: delete the caller's personal app data. If they were the last
-- member of their company, the company (and its data) is removed too.
-- (Removing the underlying login is documented as a manual/contact step.)
-- ---------------------------------------------------------------------------
create or replace function public.delete_my_data()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_company uuid := public.my_company_id();
  v_remaining int;
begin
  delete from public.reference_library where user_id = auth.uid();
  delete from public.hidden_default_items where user_id = auth.uid();
  delete from public.company_members where user_id = auth.uid();
  delete from public.profiles where id = auth.uid();
  if v_company is not null then
    select count(*) into v_remaining from public.company_members where company_id = v_company;
    if v_remaining = 0 then
      delete from public.companies where id = v_company; -- cascades products/settings/invites
    end if;
  end if;
end;
$$;
grant execute on function public.delete_my_data() to authenticated;

-- ---------------------------------------------------------------------------
-- Seed the shared, global default packaging library (only once).
-- ---------------------------------------------------------------------------
do $$
declare v_id uuid;
begin
  if not exists (select 1 from public.reference_library where user_id is null) then
    -- each insert generates its own id and mirrors it into the payload
    v_id := gen_random_uuid();
    insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Cardboard primary box','materialType','Cardboard','packagingType','primary','length',120,'width',90,'height',60,'unit','mm','averageWeight',45,'densityValue',0.000069,'notes','General small retail carton'));
    v_id := gen_random_uuid();
    insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Cardboard secondary shipping box','materialType','Cardboard','packagingType','secondary','length',250,'width',180,'height',120,'unit','mm','averageWeight',180,'densityValue',0.000033,'notes','Typical shipping carton'));
    v_id := gen_random_uuid();
    insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Cardboard tertiary transit box','materialType','Cardboard','packagingType','tertiary','length',450,'width',350,'height',300,'unit','mm','averageWeight',700,'densityValue',0.000015,'notes','Bulk transport carton'));
    v_id := gen_random_uuid();
    insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Plastic mailer','materialType','Plastic','packagingType','secondary','length',320,'width',240,'height',20,'unit','mm','averageWeight',22,'densityValue',0.000143,'notes','Co-extruded courier mailer'));
    v_id := gen_random_uuid();
    insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Plastic wrap','materialType','Plastic','packagingType','primary','length',300,'width',300,'height',40,'unit','mm','averageWeight',18,'densityValue',0.00005,'notes','Protective wrap layer'));
    v_id := gen_random_uuid();
    insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Paper sleeve','materialType','Paper','packagingType','primary','length',200,'width',120,'height',10,'unit','mm','averageWeight',12,'densityValue',0.0005,'notes','Lightweight paper wrap'));
    v_id := gen_random_uuid();
    insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Glass bottle','materialType','Glass','packagingType','primary','length',70,'width',70,'height',250,'unit','mm','averageWeight',320,'densityValue',0.000261,'notes','Standard 750 ml bottle'));
    v_id := gen_random_uuid();
    insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Aluminium can','materialType','Aluminium','packagingType','primary','length',66,'width',66,'height',122,'unit','mm','averageWeight',14,'densityValue',0.000213,'notes','330 ml beverage can'));
    v_id := gen_random_uuid();
    insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Steel tin','materialType','Steel','packagingType','primary','length',85,'width',85,'height',120,'unit','mm','averageWeight',90,'densityValue',0.000104,'notes','Food-grade steel tin'));
    v_id := gen_random_uuid();
    insert into public.reference_library(id,user_id,payload) values (v_id,null,jsonb_build_object('id',v_id,'referenceName','Wooden crate','materialType','Wood','packagingType','tertiary','length',600,'width',400,'height',300,'unit','mm','averageWeight',3500,'densityValue',0.000049,'notes','Reusable logistics crate'));
  end if;
end $$;
