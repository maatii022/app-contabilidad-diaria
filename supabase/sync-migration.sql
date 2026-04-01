create table if not exists public.monthly_opening_balances (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  month integer not null check (month between 1 and 12),
  opening_balance numeric(12, 2) not null default 0,
  source_file_id text,
  source_file_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_opening_balances_unique unique (year, month)
);

alter table public.transactions
  add column if not exists source_file_id text;
