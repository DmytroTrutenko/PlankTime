-- Year-long plank tracker — one row per (user, date).
-- Identity is set per-request via the `x-active-user` HTTP header (see README);
-- the RLS policies below read `current_setting('request.headers', true)` to
-- figure out who's calling.

create table if not exists public.plank_results (
  id uuid primary key default gen_random_uuid(),
  user_id text not null check (user_id in ('dima', 'anya')),
  date date not null,
  duration_seconds integer not null check (duration_seconds > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.plank_results enable row level security;

create or replace function public.current_active_user()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.headers', true)::json->>'x-active-user', ''),
    ''
  );
$$;

-- Everyone can read every row (it's a shared tracker).
drop policy if exists plank_results_select on public.plank_results;
create policy plank_results_select on public.plank_results
  for select
  using (true);

-- Writes are limited to rows owned by the calling user.
drop policy if exists plank_results_insert on public.plank_results;
create policy plank_results_insert on public.plank_results
  for insert
  with check (user_id = public.current_active_user());

drop policy if exists plank_results_update on public.plank_results;
create policy plank_results_update on public.plank_results
  for update
  using (user_id = public.current_active_user())
  with check (user_id = public.current_active_user());

drop policy if exists plank_results_delete on public.plank_results;
create policy plank_results_delete on public.plank_results
  for delete
  using (user_id = public.current_active_user());
