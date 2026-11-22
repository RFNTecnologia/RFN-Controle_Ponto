create table if not exists public.employees (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.time_records (
  id text primary key,
  employee_id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_holidays (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists time_records_employee_id_idx
  on public.time_records (employee_id);

alter table public.employees enable row level security;
alter table public.time_records enable row level security;
alter table public.custom_holidays enable row level security;

drop policy if exists "public employees" on public.employees;
create policy "public employees" on public.employees
  for all using (true) with check (true);

drop policy if exists "public time records" on public.time_records;
create policy "public time records" on public.time_records
  for all using (true) with check (true);

drop policy if exists "public custom holidays" on public.custom_holidays;
create policy "public custom holidays" on public.custom_holidays
  for all using (true) with check (true);

grant all on table public.employees to anon, authenticated;
grant all on table public.time_records to anon, authenticated;
grant all on table public.custom_holidays to anon, authenticated;
