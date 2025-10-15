-- Ejecuta en Supabase SQL Editor. DEMO con RLS abierto para anon (no usar en prod).
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create or replace function set_updated_at()
returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'Plan',
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger projects_updated before update on projects for each row execute function set_updated_at();

create table if not exists objectives (
  id uuid primary key default gen_random_uuid(),
  area text not null,
  title text not null,
  start_date date not null,
  end_date date not null,
  progress int not null default 0,
  status text not null default 'Plan',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger objectives_updated before update on objectives for each row execute function set_updated_at();

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  priority int not null default 3,
  due date,
  status text not null default 'Pendiente',
  project_id uuid references projects(id) on delete set null,
  objective_id uuid references objectives(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger tasks_updated before update on tasks for each row execute function set_updated_at();

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  starting_bal numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger accounts_updated before update on accounts for each row execute function set_updated_at();

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  date timestamptz not null,
  kind text not null,
  account_id uuid not null references accounts(id) on delete cascade,
  category text not null,
  amount numeric not null,
  note text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger transactions_updated before update on transactions for each row execute function set_updated_at();

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  phone text,
  email text,
  last_touch timestamptz,
  next_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger contacts_updated before update on contacts for each row execute function set_updated_at();

-- (Opcional) opportunities si las quieres luego
create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  stage text not null default 'Lead',
  est_value numeric not null default 0,
  est_close_date date,
  probability int not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger opportunities_updated before update on opportunities for each row execute function set_updated_at();

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start timestamptz not null,
  end timestamptz not null,
  location text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger events_updated before update on events for each row execute function set_updated_at();

alter table projects enable row level security;
alter table objectives enable row level security;
alter table tasks enable row level security;
alter table accounts enable row level security;
alter table transactions enable row level security;
alter table contacts enable row level security;
alter table opportunities enable row level security;
alter table events enable row level security;

create policy "anon_read_projects" on projects for select using (true);
create policy "anon_write_projects" on projects for insert with check (true);
create policy "anon_update_projects" on projects for update using (true);
create policy "anon_delete_projects" on projects for delete using (true);

create policy "anon_read_objectives" on objectives for select using (true);
create policy "anon_write_objectives" on objectives for insert with check (true);
create policy "anon_update_objectives" on objectives for update using (true);
create policy "anon_delete_objectives" on objectives for delete using (true);

create policy "anon_read_tasks" on tasks for select using (true);
create policy "anon_write_tasks" on tasks for insert with check (true);
create policy "anon_update_tasks" on tasks for update using (true);
create policy "anon_delete_tasks" on tasks for delete using (true);

create policy "anon_read_accounts" on accounts for select using (true);
create policy "anon_write_accounts" on accounts for insert with check (true);
create policy "anon_update_accounts" on accounts for update using (true);
create policy "anon_delete_accounts" on accounts for delete using (true);

create policy "anon_read_transactions" on transactions for select using (true);
create policy "anon_write_transactions" on transactions for insert with check (true);
create policy "anon_update_transactions" on transactions for update using (true);
create policy "anon_delete_transactions" on transactions for delete using (true);

create policy "anon_read_contacts" on contacts for select using (true);
create policy "anon_write_contacts" on contacts for insert with check (true);
create policy "anon_update_contacts" on contacts for update using (true);
create policy "anon_delete_contacts" on contacts for delete using (true);

create policy "anon_read_opportunities" on opportunities for select using (true);
create policy "anon_write_opportunities" on opportunities for insert with check (true);
create policy "anon_update_opportunities" on opportunities for update using (true);
create policy "anon_delete_opportunities" on opportunities for delete using (true);

create policy "anon_read_events" on events for select using (true);
create policy "anon_write_events" on events for insert with check (true);
create policy "anon_update_events" on events for update using (true);
create policy "anon_delete_events" on events for delete using (true);
