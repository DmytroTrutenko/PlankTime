import { useState } from 'react';

import { USERS } from '../config/users';
import { todayISO } from '../lib/date';
import { combinedStreak } from '../lib/progress';
import {
  ACCENT_DOT,
  ACCENT_RING,
  ACCENT_STREAK_BG_ACTIVE,
  FALLBACK_DOT,
  FALLBACK_RING,
  FALLBACK_STREAK_BG_ACTIVE,
} from '../lib/accent';
import type { Exercise, UserId, YearProgress } from '../types/progress';

interface SummaryBarProps {
  progress: YearProgress;
  formatPlank: (value: number | null) => string;
  formatPushups: (value: number | null) => string;
  // When set, render only this user's card. Used by the modal so the same
  // card layout shows for one user inside an overlay without duplicating
  // the component.
  userId?: UserId;
}

const EXERCISE_LABELS: Record<Exercise, string> = {
  plank: 'Plank',
  pushups: 'Push-ups',
};

interface ExerciseStats {
  count: number;
  best: number | null;
  average: number | null;
}

function computeStats(
  progress: YearProgress,
  userId: UserId,
  exercise: Exercise,
): ExerciseStats {
  const slotMap = progress.entries[userId];
  const values: number[] = [];
  for (const slot of Object.values(slotMap)) {
    const v = slot[exercise];
    if (v != null) values.push(v);
  }
  if (values.length === 0) {
    return { count: 0, best: null, average: null };
  }
  let sum = 0;
  let best = 0;
  for (const v of values) {
    sum += v;
    if (v > best) best = v;
  }
  return { count: values.length, best, average: Math.round(sum / values.length) };
}

// Streak badge uses the combined streak from `lib/progress` — the longest run
// of days where the user logged either exercise. Counting per-exercise would
// give two independent streaks, which adds height without adding motivation
// ("did I plank today?" is the question the bar answers).

// Single 3-column grid shared between the table header row and every metric
// row so the "Plank / Push-ups" columns line up perfectly with their values
// and the metric labels (Days / Best / Avg) sit in a dedicated gutter column.
const TABLE_GRID = 'grid grid-cols-[5rem_minmax(0,1fr)_minmax(0,1fr)]';

interface UserCardProps {
  userName: string;
  accentDot: string;
  ringClass: string;
  streakBg: string;
  streak: number;
  plankStats: ExerciseStats;
  pushupsStats: ExerciseStats;
  formatPlank: (value: number | null) => string;
  formatPushups: (value: number | null) => string;
  // The accordion (collapse header / chevron / button toggle) only makes
  // sense on desktop where two cards share the screen. In the mobile modal
  // a single card already has the full width to itself, so the toggle is
  // pure noise — set this to drop the button affordance and always show
  // the stats table.
  alwaysExpanded?: boolean;
}

function UserCard({
  userName,
  accentDot,
  ringClass,
  streakBg,
  streak,
  plankStats,
  pushupsStats,
  formatPlank,
  formatPushups,
  alwaysExpanded = false,
}: UserCardProps) {
  const [expanded, setExpanded] = useState(true);
  const isExpanded = alwaysExpanded || expanded;
  const streakActive = streak > 0;
  const contentId = `summary-${userName}`;

  const headerInner = (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className={`inline-block h-3 w-3 shrink-0 rounded-full ring-2 ring-white dark:ring-stone-950 ${accentDot}`}
      />
      <h2 className="truncate text-base font-semibold tracking-tight text-stone-900 dark:text-stone-50">
        {userName}
      </h2>
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold leading-none tabular-nums transition-colors ${streakBg}`}
        title={streakActive ? 'Consecutive days ending today' : 'No active streak'}
      >
        <span aria-hidden="true">🔥</span>
        {streak} {streakActive ? (streak === 1 ? 'day' : 'days') : ''}
      </span>
    </div>
  );

  return (
    <div
      className={`relative min-w-0 overflow-hidden rounded-2xl bg-white shadow-lift ring-1 transition-all duration-200 dark:bg-stone-950 dark:ring-stone-800 ${ringClass}`}
    >
      {alwaysExpanded ? (
        <div className="flex w-full items-center gap-3 px-5 py-3.5">{headerInner}</div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={contentId}
          className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-stone-50 dark:hover:bg-stone-900/60"
        >
          {headerInner}
          <Chevron
            className={`shrink-0 text-stone-400 transition-transform duration-200 dark:text-stone-500 ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}

      {isExpanded && (
        <div
          id={contentId}
          className="border-t border-stone-200 px-4 pb-4 pt-3 dark:border-stone-800"
        >
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
            <div className={`${TABLE_GRID} gap-x-3 items-center bg-stone-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-stone-600 dark:bg-stone-800 dark:text-stone-300`}>
              {/* Spacer in the label column so the column header sits over
                  the value columns, not over the metric labels below. */}
              <div aria-hidden="true" />
              <div className="border-l border-stone-200 text-center dark:border-stone-800">
                {EXERCISE_LABELS.plank}
              </div>
              <div className="border-l border-stone-200 text-center dark:border-stone-800">
                {EXERCISE_LABELS.pushups}
              </div>
            </div>
            <div>
              {(
                [
                  { label: 'Days', plank: plankStats.count, pushups: pushupsStats.count, numeric: true },
                  { label: 'Best', plank: plankStats.best, pushups: pushupsStats.best, numeric: false },
                  { label: 'Avg', plank: plankStats.average, pushups: pushupsStats.average, numeric: false },
                ] as const
              ).map((row, idx) => (
                <div
                  key={row.label}
                  className={`${TABLE_GRID} gap-x-3 items-center border-t border-stone-200 px-3 py-2 text-sm dark:border-stone-800 ${
                    idx % 2 === 1
                      ? 'bg-stone-50 dark:bg-stone-800/50'
                      : ''
                  }`}
                >
                  <div className="text-left text-[11px] font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    {row.label}
                  </div>
                  <div className="border-l border-stone-200 text-center font-mono font-semibold tabular-nums text-stone-900 dark:border-stone-800 dark:text-stone-50 truncate">
                    {row.numeric ? String(row.plank) : formatPlank(row.plank)}
                  </div>
                  <div className="border-l border-stone-200 text-center font-mono font-semibold tabular-nums text-stone-900 dark:border-stone-800 dark:text-stone-50 truncate">
                    {row.numeric ? String(row.pushups) : formatPushups(row.pushups)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Chevron({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`h-4 w-4 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 7l5 5 5-5" />
    </svg>
  );
}

export function SummaryBar({ progress, formatPlank, formatPushups, userId }: SummaryBarProps) {
  const today = todayISO();
  const users = userId ? USERS.filter((u) => u.id === userId) : USERS;
  return (
    <section className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
      {users.map((user) => {
        const dotClass = ACCENT_DOT[user.accent] ?? FALLBACK_DOT;
        const ringClass = ACCENT_RING[user.accent] ?? FALLBACK_RING;
        const streak = combinedStreak(progress, user.id, today);
        const streakBg =
          streak > 0
            ? (ACCENT_STREAK_BG_ACTIVE[user.accent] ?? FALLBACK_STREAK_BG_ACTIVE)
            : 'bg-stone-200 text-stone-500 dark:bg-stone-800 dark:text-stone-400';
        return (
          <UserCard
            key={user.id}
            userName={user.name}
            accentDot={dotClass}
            ringClass={ringClass}
            streakBg={streakBg}
            streak={streak}
            plankStats={computeStats(progress, user.id, 'plank')}
            pushupsStats={computeStats(progress, user.id, 'pushups')}
            formatPlank={formatPlank}
            formatPushups={formatPushups}
            alwaysExpanded={userId != null}
          />
        );
      })}
    </section>
  );
}