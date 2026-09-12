import { USERS } from '../config/users';
import { formatSeconds, todayISO } from '../lib/date';
import { currentStreak } from '../lib/progress';
import type { UserId, YearProgress } from '../types/progress';

interface SummaryBarProps {
  progress: YearProgress;
}

interface UserStats {
  count: number;
  best: number | null;
  average: number | null;
  streak: number;
}

function computeStats(progress: YearProgress, userId: UserId): UserStats {
  const values = Object.values(progress.entries[userId]);
  if (values.length === 0) {
    return { count: 0, best: null, average: null, streak: 0 };
  }
  let sum = 0;
  let best = 0;
  for (const v of values) {
    sum += v;
    if (v > best) best = v;
  }
  return {
    count: values.length,
    best,
    average: Math.round(sum / values.length),
    streak: currentStreak(progress, userId, todayISO()),
  };
}

const ACCENT_RING: Record<string, string> = {
  sky: 'ring-sky-200/70 dark:ring-sky-900/50',
  rose: 'ring-rose-200/70 dark:ring-rose-900/50',
};

const ACCENT_DOT: Record<string, string> = {
  sky: 'bg-sky-500',
  rose: 'bg-rose-500',
};

const ACCENT_STREAK_BG: Record<string, string> = {
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
};

const ACCENT_STREAK_BG_ACTIVE: Record<string, string> = {
  sky: 'bg-sky-500 text-white shadow-[0_0_0_3px_rgb(14,165,233,0.18)] dark:bg-sky-500 dark:shadow-[0_0_0_3px_rgb(14,165,233,0.28)]',
  rose: 'bg-rose-500 text-white shadow-[0_0_0_3px_rgb(244,63,94,0.18)] dark:bg-rose-500 dark:shadow-[0_0_0_3px_rgb(244,63,94,0.28)]',
};

export function SummaryBar({ progress }: SummaryBarProps) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {USERS.map((user) => {
        const stats = computeStats(progress, user.id);
        const streakActive = stats.streak > 0;
        return (
          <div
            key={user.id}
            className={`rounded-2xl bg-white p-4 shadow-soft ring-1 transition-shadow hover:shadow-lift dark:bg-stone-950 dark:ring-stone-800/60 ${ACCENT_RING[user.accent] ?? 'ring-stone-200/70 dark:ring-stone-800/60'}`}
          >
            <header className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${ACCENT_DOT[user.accent] ?? 'bg-stone-400'}`} />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-700 dark:text-stone-200">
                  {user.name}
                </h2>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums transition-colors ${
                  streakActive
                    ? ACCENT_STREAK_BG_ACTIVE[user.accent] ?? 'bg-stone-800 text-white'
                    : ACCENT_STREAK_BG[user.accent] ?? 'bg-stone-100 text-stone-500 dark:bg-stone-900 dark:text-stone-400'
                }`}
                title={streakActive ? 'Consecutive days ending today' : 'No active streak'}
              >
                <span className="mr-0.5">🔥</span>
                {stats.streak}d
              </span>
            </header>

            <dl className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Days" value={String(stats.count)} />
              <Stat label="Best" value={formatSeconds(stats.best)} />
              <Stat label="Average" value={formatSeconds(stats.average)} />
            </dl>
          </div>
        );
      })}
    </section>
  );
}

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded-xl bg-stone-50 px-2 py-2 dark:bg-stone-900/70">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-base font-semibold tabular-nums text-stone-900 dark:text-stone-50">
        {value}
      </dd>
    </div>
  );
}
