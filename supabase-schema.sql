-- Antes de executar, crie em Authentication > Users o usuário administrador
-- usando o mesmo e-mail do perfil admin já cadastrado.
-- Para usar outro e-mail, atualize antes o e-mail do perfil admin:
-- update public.employees
-- set data = jsonb_set(data, '{email}', to_jsonb('SEU_EMAIL_REAL'::text))
-- where data->>'admin' = 'true';
do $$
begin
  if not exists (
    select 1
    from auth.users users
    join public.employees employees
      on lower(users.email) = lower(employees.data->>'email')
    where employees.data->>'admin' = 'true'
  ) then
    raise exception 'Crie primeiro o usuário administrador no Supabase Auth com o e-mail do perfil admin existente.';
  end if;
end;
$$;

create table if not exists public.employees (
  id text primary key,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.employees
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

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

create table if not exists public.employee_invites (
  id text primary key,
  email text not null unique,
  data jsonb not null default '{}'::jsonb,
  created_by uuid default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.requests (
  id text primary key,
  employee_id text not null references public.employees(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id text primary key,
  employee_id text not null references public.employees(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists time_records_employee_id_idx
  on public.time_records (employee_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.employees
    where auth_user_id = auth.uid()
      and data->>'admin' = 'true'
      and data->>'ativo' = 'true'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.protect_employee_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if new.data ? 'senha' or new.data ? 'id' then
    raise exception 'Credenciais e identificadores devem ficar fora do perfil.';
  end if;

  if tg_op = 'UPDATE' and auth.uid() is not null and not public.is_admin() and (
    new.id is distinct from old.id
    or new.auth_user_id is distinct from old.auth_user_id
    or new.data->>'admin' is distinct from old.data->>'admin'
    or new.data->>'ativo' is distinct from old.data->>'ativo'
    or new.data->>'email' is distinct from old.data->>'email'
    or new.data->>'matricula' is distinct from old.data->>'matricula'
  ) then
    if current_setting('app.employee_invite_link', true) = 'true' then
      return new;
    end if;
    raise exception 'Somente um administrador pode alterar os campos protegidos do perfil.';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists protect_employee_profile on public.employees;
create trigger protect_employee_profile
  before insert or update on public.employees
  for each row execute function public.protect_employee_profile();

create or replace function public.create_employee_from_invite()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  invite public.employee_invites%rowtype;
  profile jsonb;
  linked boolean;
begin
  select * into invite
  from public.employee_invites
  where lower(email) = lower(new.email)
  for update;

  if not found then
    raise exception 'Este e-mail não possui um convite ativo.';
  end if;

  profile := (invite.data - 'senha' - 'id') || jsonb_build_object(
    'email', new.email,
    'admin', coalesce((invite.data->>'admin')::boolean, false),
    'ativo', true
  );

  perform set_config('app.employee_invite_link', 'true', true);
  update public.employees
  set auth_user_id = new.id,
      data = profile,
      updated_at = now()
  where id = invite.id
    and auth_user_id is null;
  linked := found;
  perform set_config('app.employee_invite_link', 'false', true);

  if not linked then
    insert into public.employees (id, auth_user_id, data)
    values (invite.id, new.id, profile);
  end if;

  delete from public.employee_invites where id = invite.id;
  return new;
end;
$$;

revoke all on function public.protect_employee_profile() from public, anon, authenticated;
revoke all on function public.create_employee_from_invite() from public, anon, authenticated;

drop trigger if exists create_employee_from_invite on auth.users;
create trigger create_employee_from_invite
  after insert on auth.users
  for each row execute function public.create_employee_from_invite();

create or replace function public.protect_time_record()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if not public.is_admin() then
    if new.data->>'idEmpregado' is distinct from new.employee_id
      or new.data->>'tipo' not in ('entrada', 'saida', 'justificativa') then
      raise exception 'Registro de ponto inválido.';
    end if;

    if new.data->>'tipo' in ('entrada', 'saida') then
      new.data := jsonb_set(
        new.data,
        '{dataHora}',
        to_jsonb(to_char(clock_timestamp() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
        true
      );
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.protect_time_record() from public, anon, authenticated;

drop trigger if exists protect_time_record on public.time_records;
create trigger protect_time_record
  before insert on public.time_records
  for each row execute function public.protect_time_record();

update public.employees
set data = data - 'senha' - 'id',
    auth_user_id = coalesce(
      auth_user_id,
      (select users.id from auth.users as users where lower(users.email) = lower(employees.data->>'email') limit 1)
    ),
    updated_at = now();

insert into public.employee_invites (id, email, data)
select id, lower(data->>'email'), data - 'senha' - 'id'
from public.employees
where auth_user_id is null
  and data->>'admin' is distinct from 'true'
  and nullif(trim(data->>'email'), '') is not null
on conflict (email) do update
set id = excluded.id,
    data = excluded.data;

alter table public.employees enable row level security;
alter table public.time_records enable row level security;
alter table public.custom_holidays enable row level security;
alter table public.employee_invites enable row level security;
alter table public.app_settings enable row level security;
alter table public.requests enable row level security;
alter table public.activities enable row level security;

drop policy if exists "public employees" on public.employees;
drop policy if exists "employees read own or admin" on public.employees;
drop policy if exists "employees admin insert" on public.employees;
drop policy if exists "employees update own or admin" on public.employees;
drop policy if exists "employees admin delete" on public.employees;

create policy "employees read own or admin" on public.employees
  for select to authenticated
  using (auth_user_id = auth.uid() or public.is_admin());

create policy "employees admin insert" on public.employees
  for insert to authenticated
  with check (public.is_admin());

create policy "employees update own or admin" on public.employees
  for update to authenticated
  using (auth_user_id = auth.uid() or public.is_admin())
  with check (auth_user_id = auth.uid() or public.is_admin());

create policy "employees admin delete" on public.employees
  for delete to authenticated
  using (public.is_admin());

drop policy if exists "public time records" on public.time_records;
drop policy if exists "time records read own or admin" on public.time_records;
drop policy if exists "time records insert own or admin" on public.time_records;
drop policy if exists "time records admin update" on public.time_records;
drop policy if exists "time records admin delete" on public.time_records;

create policy "time records read own or admin" on public.time_records
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.employees
      where employees.id = time_records.employee_id
        and employees.auth_user_id = auth.uid()
    )
  );

create policy "time records insert own or admin" on public.time_records
  for insert to authenticated
  with check (
    public.is_admin()
    or (
      data->>'idEmpregado' = employee_id
      and exists (
        select 1 from public.employees
        where employees.id = time_records.employee_id
          and employees.auth_user_id = auth.uid()
      )
    )
  );

create policy "time records admin update" on public.time_records
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "time records admin delete" on public.time_records
  for delete to authenticated
  using (public.is_admin());

drop policy if exists "public custom holidays" on public.custom_holidays;
drop policy if exists "custom holidays authenticated read" on public.custom_holidays;
drop policy if exists "custom holidays admin insert" on public.custom_holidays;
drop policy if exists "custom holidays admin update" on public.custom_holidays;
drop policy if exists "custom holidays admin delete" on public.custom_holidays;

create policy "custom holidays authenticated read" on public.custom_holidays
  for select to authenticated
  using (true);

create policy "custom holidays admin insert" on public.custom_holidays
  for insert to authenticated
  with check (public.is_admin());

create policy "custom holidays admin update" on public.custom_holidays
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "custom holidays admin delete" on public.custom_holidays
  for delete to authenticated
  using (public.is_admin());

drop policy if exists "employee invites admin only" on public.employee_invites;
create policy "employee invites admin only" on public.employee_invites
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "app settings authenticated read" on public.app_settings;
drop policy if exists "app settings admin write" on public.app_settings;
create policy "app settings authenticated read" on public.app_settings
  for select to authenticated using (true);
create policy "app settings admin write" on public.app_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "requests own or admin" on public.requests;
drop policy if exists "requests insert own or admin" on public.requests;
drop policy if exists "requests admin update" on public.requests;
create policy "requests own or admin" on public.requests
  for select to authenticated
  using (public.is_admin() or exists (
    select 1 from public.employees
    where employees.id = requests.employee_id
      and employees.auth_user_id = auth.uid()
  ));
create policy "requests insert own or admin" on public.requests
  for insert to authenticated
  with check (public.is_admin() or exists (
    select 1 from public.employees
    where employees.id = requests.employee_id
      and employees.auth_user_id = auth.uid()
  ));
create policy "requests admin update" on public.requests
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "activities own or admin" on public.activities;
drop policy if exists "activities insert own or admin" on public.activities;
drop policy if exists "activities admin update" on public.activities;
create policy "activities own or admin" on public.activities
  for select to authenticated
  using (public.is_admin() or exists (
    select 1 from public.employees
    where employees.id = activities.employee_id
      and employees.auth_user_id = auth.uid()
  ));
create policy "activities insert own or admin" on public.activities
  for insert to authenticated
  with check (public.is_admin() or exists (
    select 1 from public.employees
    where employees.id = activities.employee_id
      and employees.auth_user_id = auth.uid()
  ));
create policy "activities admin update" on public.activities
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on table public.employees, public.time_records, public.custom_holidays, public.employee_invites,
  public.app_settings, public.requests, public.activities
  from public, anon, authenticated;
grant select, insert, update, delete on table public.employees, public.time_records, public.custom_holidays,
  public.employee_invites, public.app_settings, public.requests, public.activities to authenticated;
