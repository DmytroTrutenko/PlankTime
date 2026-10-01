-- Push-ups tracker — same shape as plank_results, but `reps` instead of
-- `duration_seconds`. Identity and RLS rules are identical; one row per
-- (user, date) per exercise.

create table if not exists public.pushups (
  id uuid primary key default gen_random_uuid(),
  user_id text not null check (user_id in ('dima', 'anya')),
  date date not null,
  reps integer not null check (reps > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.pushups enable row level security;

-- Everyone can read every row (it's a shared tracker).
drop policy if exists pushups_select on public.pushups;
create policy pushups_select on public.pushups
  for select
  using (true);

-- Writes are limited to rows owned by the calling user.
drop policy if exists pushups_insert on public.pushups;
create policy pushups_insert on public.pushups
  for insert
  with check (user_id = public.current_active_user());

drop policy if exists pushups_update on public.pushups;
create policy pushups_update on public.pushups
  for update
  using (user_id = public.current_active_user())
  with check (user_id = public.current_active_user());

drop policy if exists pushups_delete on public.pushups;
create policy pushups_delete on public.pushups
  for delete
  using (user_id = public.current_active_user());
