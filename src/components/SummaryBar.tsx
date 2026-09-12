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
  sky: 'ring-sky-200 dark:ring-sky-800/60',
  rose: 'ring-rose-200 dark:ring-rose-800/60',
};

const ACCENT_DOT: Record<string, string> = {
  sky: 'bg-sky-500',
  rose: 'bg-rose-500',
};

const ACCENT_STREAK_BG: Record<string, string> = {
  sky: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
  rose: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
};

const ACCENT_STREAK_BG_ACTIVE: Record<string, string> = {
  sky: 'bg-sky-500 text-white dark:bg-sky-500',
  rose: 'bg-rose-500 text-white dark:bg-rose-500',
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
            className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 transition-shadow hover:shadow-md dark:bg-slate-900 dark:ring-slate-700/60 ${ACCENT_RING[user.accent] ?? ''}`}
          >
            <header className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${ACCENT_DOT[user.accent] ?? 'bg-slate-400'}`} />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                  {user.name}
                </h2>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums transition-colors ${
                  streakActive
                    ? ACCENT_STREAK_BG_ACTIVE[user.accent] ?? 'bg-slate-700 text-white'
                    : ACCENT_STREAK_BG[user.accent] ?? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
                title={streakActive ? 'Consecutive days ending today' : 'No active streak'}
              >
                🔥 {stats.streak}d
              </span>
            </header>

            <dl className="grid grid-cols-3 gap-3 text-center">
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
    <div className="rounded-xl bg-slate-50 px-2 py-2 dark:bg-slate-800/60">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-slate-50">
        {value}
      </dd>
    </div>
  );
}