# PlankTime

A shared year-long tracker for two people — plank (time) and push-ups (reps). Click a cell, type a value, press Enter — your result is saved to Supabase and visible to your partner from any browser.

**Live:** https://&lt;your-github-username&gt;.github.io/PlankTime/

## Stack

- React 18 + Vite 5 + TypeScript
- Tailwind CSS
- Supabase (Postgres + PostgREST + RLS) — no auth, two hard-coded users identified by an `x-active-user` header
- GitHub Actions → GitHub Pages for hosting

## Local development

```bash
cp .env.example .env       # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev                # http://localhost:5173
```

Quality gates:

```bash
npm run lint               # ESLint
npm run typecheck          # tsc -b --noEmit
npm run build              # typecheck + vite build
npm run format             # prettier --write .
npm run smoke-test         # end-to-end CRUD against live Supabase
npm run optimize-assets    # regenerate hero.webp from hero.jpg
```

## Project layout

```
src/
  App.tsx                      page shell, background, two tracker sections
  main.tsx                     React entry
  components/
    Header.tsx                 plank / push-ups tab strip + theme slot
    TrackerSection.tsx          heading + summary + table for one exercise
    ProgressTable.tsx          year grid (desktop table + mobile cards + months)
    ResultCell.tsx             tap-to-edit cell, shared by both surfaces
    MonthSection.tsx            month accordion context + chevron icon
    SummaryBar.tsx             per-user stats (days / best / avg / streak)
    ThemeToggle.tsx            light / dark / system switch
  config/users.ts              the two users (Dima, Anya)
  hooks/
    useYearProgress.ts         generic load + write hook (per-exercise config)
    useTheme.ts                theme state
  lib/
    accent.ts                  tailwind class maps keyed by user accent
    date.ts                    date formatting + time / reps parsing
    progress.ts                pure progress computations
    supabase.ts                typed client (env vars + persistSession: false)
    tracker.ts                 DB queries + x-active-user header rotation
  types/
    database.ts                typed Database schema (plank_results + pushups)
    progress.ts                UserId, YearProgress
supabase/
  schema.sql                   full schema (apply to fresh project)
  migrations/                  incremental SQL migrations
scripts/
  smoke-test.ts                end-to-end CRUD against live Supabase
  optimize-assets.ts           JPEG/PNG → WebP via sharp
.github/workflows/deploy.yml   build + deploy to GitHub Pages on push
public/images/                 hero.jpg (source) + hero.webp (generated)
```

## Database

Two tables, one row per (user, date) per exercise. Migrations live in `supabase/migrations/`; `supabase/schema.sql` is the canonical snapshot.

RLS reads `current_setting('request.headers', true)::json->>'x-active-user'`. Everyone can `SELECT` (shared tracker); each user can write/delete only their own rows. See `supabase/schema.sql` for the exact policies.

## Identity without auth

The anon key is shipped in the client. Identity is the `x-active-user: dima|anya` header, rotated before each write. RLS enforces `user_id = current_active_user()`. Fine for two people who trust each other — **do not** use this pattern where real auth is required.

## Deployment

Push to `feat/**` or `main` triggers `.github/workflows/deploy.yml`: install → typecheck + lint → build with `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from secrets → upload `dist/` via `actions/deploy-pages@v4`. Secrets live at **Settings → Secrets and variables → Actions**; Pages is at **Settings → Pages → Source: GitHub Actions**.

## Known shortcuts

- iOS Safari would auto-zoom on input focus if the input font were < 16px; the input is forced to 16px.
- No timezone handling — `todayISO()` uses the browser's local date.
- The smoke test mutates PostgrestClient's internal `Headers` via a type cast; if supabase-js v3 changes that private API, the test will need updating.
- The background gradient in `TrackerSection` is intentionally semi-transparent (`bg-canvas/70 via-canvas/55 to-canvas-deep/70`) so the fixed hero photo in `.page-bg` shows through. Cards inside the section still have their own opaque backgrounds for readability.
- Past dates are locked — `ResultCell` renders the input `readOnly` and `setResult` in `useYearProgress` short-circuits when `dateISO < today`, so historical cells can't be edited from the UI. Today and future cells stay editable.
