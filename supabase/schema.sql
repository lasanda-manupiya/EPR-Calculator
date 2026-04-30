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

alter table public.products enable row level security;
alter table public.reference_library enable row level security;
alter table public.company_settings enable row level security;

drop policy if exists "Allow read/write with anon key" on public.products;
drop policy if exists "Allow read/write with anon key" on public.reference_library;
drop policy if exists "Allow read/write with anon key" on public.company_settings;

create policy "Allow read/write with anon key" on public.products for all using (true) with check (true);
create policy "Allow read/write with anon key" on public.reference_library for all using (true) with check (true);
create policy "Allow read/write with anon key" on public.company_settings for all using (true) with check (true);
