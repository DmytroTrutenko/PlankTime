import { USERS } from '../config/users';
import { todayISO } from '../lib/date';
import {
  ACCENT_DOT,
  ACCENT_RING,
  ACCENT_STREAK_BG,
  ACCENT_STREAK_BG_ACTIVE,
  FALLBACK_DOT,
  FALLBACK_RING,
  FALLBACK_STREAK_BG,
  FALLBACK_STREAK_BG_ACTIVE,
} from '../lib/accent';
import { currentStreak } from '../lib/progress';
import type { UserId, YearProgress } from '../types/progress';

interface SummaryBarProps {
  progress: YearProgress;
  formatValue: (value: number | null) => string;
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

export function SummaryBar({ progress, formatValue }: SummaryBarProps) {
  return (
    <section className="grid grid-cols-2 gap-2 sm:gap-3">
      {USERS.map((user) => {
        const stats = computeStats(progress, user.id);
        const streakActive = stats.streak > 0;
        const dotClass = ACCENT_DOT[user.accent] ?? FALLBACK_DOT;
        const ringClass = ACCENT_RING[user.accent] ?? FALLBACK_RING;
        const streakBg = streakActive
          ? (ACCENT_STREAK_BG_ACTIVE[user.accent] ?? FALLBACK_STREAK_BG_ACTIVE)
          : (ACCENT_STREAK_BG[user.accent] ?? FALLBACK_STREAK_BG);
        return (
          <div
            key={user.id}
            className={`min-w-0 rounded-2xl bg-white p-2.5 shadow-soft ring-1 transition-shadow hover:shadow-lift sm:p-4 dark:bg-stone-950 dark:ring-stone-800/60 ${ringClass}`}
          >
            <header className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
                <h2 className="truncate text-sm font-semibold uppercase tracking-wide text-stone-700 dark:text-stone-200">
                  {user.name}
                </h2>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none tabular-nums transition-colors sm:px-2.5 ${streakBg}`}
                title={streakActive ? 'Consecutive days ending today' : 'No active streak'}
              >
                <span aria-hidden="true">🔥</span>
                {stats.streak}d
              </span>
            </header>

            <dl className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:gap-2">
              <Stat label="Days" value={String(stats.count)} />
              <Stat label="Best" value={formatValue(stats.best)} />
              <Stat label="Average" value={formatValue(stats.average)} />
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
  className?: string;
}

function Stat({ label, value, className = '' }: StatProps) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-xl bg-stone-50 px-2.5 py-1.5 sm:flex-col sm:justify-center sm:gap-0 sm:px-2 sm:py-2 dark:bg-stone-900/70 ${className}`}
    >
      <dt className="text-[10px] font-medium uppercase tracking-wider text-stone-500 sm:mt-0 sm:text-[11px] dark:text-stone-400">
        {label}
      </dt>
      <dd className="font-mono text-sm font-semibold tabular-nums text-stone-900 sm:mt-1 dark:text-stone-50">
        {value}
      </dd>
    </div>
  );
}
