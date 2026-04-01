create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('expense', 'income')),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  source_system text not null default 'google_sheets',
  source_file_id text,
  source_file_name text,
  source_sheet_name text,
  source_row integer,
  type text not null check (type in ('expense', 'income')),
  transaction_date date not null,
  amount numeric(12, 2) not null check (amount >= 0),
  description text not null,
  category_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now(),
  constraint transactions_source_unique unique (source_file_name, source_sheet_name, source_row, type)
);

create index if not exists transactions_date_idx on public.transactions (transaction_date desc);
create index if not exists transactions_type_idx on public.transactions (type);
create index if not exists transactions_category_idx on public.transactions (category_name);

create table if not exists public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  month integer not null check (month between 1 and 12),
  type text not null check (type in ('expense', 'income')),
  category_name text not null,
  planned_amount numeric(12, 2) not null check (planned_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_budgets_unique unique (year, month, type, category_name)
);

create table if not exists public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'google_sheets',
  status text not null check (status in ('running', 'success', 'error')),
  message text,
  processed_count integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

insert into public.categories (type, name, slug, sort_order, is_active)
values
  ('expense', 'Comida', 'comida', 1, true),
  ('expense', 'Regalos', 'regalos', 2, true),
  ('expense', 'Yo', 'yo', 3, true),
  ('expense', 'Vivienda', 'vivienda', 4, true),
  ('expense', 'Transporte', 'transporte', 5, true),
  ('expense', 'Gastos personales', 'gastos-personales', 6, true),
  ('expense', 'Deuda', 'deuda', 7, true),
  ('expense', 'Suministros (luz, agua, gas, etc.)', 'suministros-luz-agua-gas-etc', 8, true),
  ('expense', 'Viajes', 'viajes', 9, true),
  ('expense', 'Ocio', 'ocio', 10, true),
  ('expense', 'Trabajo', 'trabajo', 11, true),
  ('expense', 'Trading', 'trading-gasto', 12, true),
  ('expense', 'Apuestas', 'apuestas', 13, true),
  ('expense', 'Otros', 'otros', 14, true),
  ('income', 'Ahorro', 'ahorro', 1, true),
  ('income', 'Sueldo', 'sueldo', 2, true),
  ('income', 'Trading', 'trading-ingreso', 3, true),
  ('income', 'Juandi', 'juandi', 4, true),
  ('income', 'MS Asesoría', 'ms-asesoria', 5, true),
  ('income', 'Otro', 'otro', 6, true)
on conflict (slug) do nothing;
