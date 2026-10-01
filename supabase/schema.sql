-- PlankTime schema — single source of truth for the live database.
-- Apply via Supabase SQL editor or `supabase db push` against a fresh
-- project. Equivalent migrations live in supabase/migrations/ for
-- incremental history.

create table if not exists public.plank_results (
  id               uuid primary key default gen_random_uuid(),
  user_id          text not null check (user_id in ('dima', 'anya')),
  date             date not null,
  duration_seconds integer not null check (duration_seconds > 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.pushups (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null check (user_id in ('dima', 'anya')),
  date        date not null,
  reps        integer not null check (reps > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.plank_results enable row level security;
alter table public.pushups        enable row level security;

-- Identity helper: pulls the active user from the `x-active-user` header
-- the React app rotates before every write. Returns '' if absent.
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

-- Read: open to everyone (the tracker is shared).
drop policy if exists plank_results_select on public.plank_results;
create policy plank_results_select on public.plank_results
  for select using (true);

drop policy if exists pushups_select on public.pushups;
create policy pushups_select on public.pushups
  for select using (true);

-- Writes: caller can only touch their own rows.
drop policy if exists plank_results_insert on public.plank_results;
create policy plank_results_insert on public.plank_results
  for insert with check (user_id = public.current_active_user());

drop policy if exists plank_results_update on public.plank_results;
create policy plank_results_update on public.plank_results
  for update using (user_id = public.current_active_user())
              with check (user_id = public.current_active_user());

drop policy if exists plank_results_delete on public.plank_results;
create policy plank_results_delete on public.plank_results
  for delete using (user_id = public.current_active_user());

drop policy if exists pushups_insert on public.pushups;
create policy pushups_insert on public.pushups
  for insert with check (user_id = public.current_active_user());

drop policy if exists pushups_update on public.pushups;
create policy pushups_update on public.pushups
  for update using (user_id = public.current_active_user())
              with check (user_id = public.current_active_user());

drop policy if exists pushups_delete on public.pushups;
create policy pushups_delete on public.pushups
  for delete using (user_id = public.current_active_user());