# PlankTime

A year-long plank tracker for two people. Click a cell, type a time (`90`, `1:25`, `2:10`), press Enter — your result is saved to Supabase and visible to your partner from any browser.

**Live:** https://&lt;your-github-username&gt;.github.io/PlankTime/

## Stack

- React 18 + Vite 5 + TypeScript
- Tailwind CSS for styling
- Material UI `TextField` for the per-cell input
- Supabase (Postgres + PostgREST + RLS) as the shared backend — no auth, two hardcoded users identified by an `x-plank-user` header
- GitHub Actions → GitHub Pages for hosting (no server to run)

## Local development

```bash
cp .env.example .env       # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev                # http://localhost:5173
```

Quality gates:

```bash
npm run lint
npm run typecheck
npm run build
npm run smoke-test         # end-to-end CRUD against the live Supabase project
```

## Database

Single table, two hardcoded user IDs, one row per (user, date):

```sql
create table public.plank_results (
  id uuid primary key default gen_random_uuid(),
  user_id text not null check (user_id in ('dima', 'anya')),
  date date not null,
  duration_seconds integer not null check (duration_seconds > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.plank_results enable row level security;
```

RLS reads `current_setting('request.headers', true)::json->>'x-plank-user'` and only allows each user to read everything (shared view) but write/delete only their own rows. See `supabase/migrations/` for the exact policies.

## How user identity works (no auth)

The Supabase JS client is the anon key — anyone can hit the REST API. Identity is established by a custom HTTP header `x-plank-user: dima|anya` that the React app rotates before each write. The RLS `WITH CHECK` clause compares the header to the row's `user_id`, so:

- `x-plank-user: dima` can insert/update/delete only rows where `user_id = 'dima'`
- `x-plank-user: anya` likewise for their own rows
- everyone can `SELECT` (it's a shared tracker)

This is intentionally minimal — there's no login, no JWT, no session. Fine for two people who trust each other. **Do not** use this pattern for anything that needs real auth.

## Project layout

```
src/
  App.tsx                      page shell + header
  components/
    ProgressTable.tsx          year grid with editable cells
    SummaryBar.tsx             per-user stats (days / best / avg / streak)
  config/users.ts              the two users (Dima, Anya)
  hooks/useYearProgress.ts     load year + write/delete with optimistic UI
  lib/
    date.ts                    date formatting + time parsing
    progress.ts                pure progress computations
    supabase.ts                client + KNOWN_USER_IDS + setActiveUserHeader
  types/
    database.ts                typed Database schema for plank_results
    progress.ts                UserId, YearProgress
scripts/
  smoke-test.ts                manual end-to-end CRUD against live Supabase
.github/workflows/deploy.yml   build + deploy to GitHub Pages on push
```

## Deployment

Push to `feat/**` or `master` triggers `.github/workflows/deploy.yml`:

1. install
2. typecheck + lint
3. build with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from repo secrets
4. upload `dist/` and deploy via `actions/deploy-pages@v4`

Secrets live at **Settings → Secrets and variables → Actions**. Pages is configured at **Settings → Pages → Source: GitHub Actions**.

## Limitations / known shortcuts

- iOS Safari would auto-zoom the viewport on input focus if the input font were < 16px; the input is forced to 16px to prevent that. If you shrink it back below 16px, add `user-scalable=no` to the viewport meta as a trade-off.
- No timezone handling — `todayISO()` uses the browser's local date, which can disagree with Supabase's `current_date` if you cross midnight while editing.
- The smoke test rotates `x-plank-user` by mutating the PostgrestClient's internal `Headers` instance via a type cast; if supabase-js v3 changes that private API, the test will need an update.