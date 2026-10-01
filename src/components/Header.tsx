import type { ReactNode } from 'react';

import { USERS } from '../config/users';
import { todayISO } from '../lib/date';
import {
  ACCENT_DOT,
  ACCENT_RING,
  ACCENT_STREAK_BG_ACTIVE,
  FALLBACK_DOT,
  FALLBACK_RING,
  FALLBACK_STREAK_BG_ACTIVE,
} from '../lib/accent';
import { combinedStreak } from '../lib/progress';
import type { UserId, YearProgress } from '../types/progress';

interface HeaderProps {
  rightSlot?: ReactNode;
  // Triggered on mobile when the user taps one of the user pills in the
  // header — opens the SummaryModal for that user. Hidden on md+ where the
  // summary lives inline above the table.
  onOpenSummary?: (userId: UserId) => void;
  // Needed to render the per-user streak pill next to each user name in the
  // mobile header pills. Optional so the header is still usable (with just
  // the user pills) before progress has loaded.
  progress?: YearProgress;
}

export function Header({ rightSlot, onOpenSummary, progress }: HeaderProps) {
  const today = todayISO();
  return (
    <header className="sticky top-0 z-40 h-14 bg-canvas/85 backdrop-blur supports-[backdrop-filter]:bg-canvas/70 dark:bg-canvas-night/85 dark:supports-[backdrop-filter]:bg-canvas-night/70">
      <div className="mx-auto flex h-full max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Mobile-only user pills. On md+ the SummaryBar renders inline
            above the table, so the header pills would be redundant and
            are hidden to keep the header uncluttered. */}
        {onOpenSummary && (
          <div className="flex min-w-0 items-center gap-2 md:hidden">
            {USERS.map((user) => {
              const dot = ACCENT_DOT[user.accent] ?? FALLBACK_DOT;
              const ring = ACCENT_RING[user.accent] ?? FALLBACK_RING;
              const streak = progress ? combinedStreak(progress, user.id, today) : 0;
              const streakActive = streak > 0;
              const streakBg = streakActive
                ? (ACCENT_STREAK_BG_ACTIVE[user.accent] ?? FALLBACK_STREAK_BG_ACTIVE)
                : 'bg-stone-200 text-stone-500 dark:bg-stone-800 dark:text-stone-400';
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onOpenSummary(user.id)}
                  aria-label={`Open ${user.name} summary, ${streak} ${streak === 1 ? 'day' : 'days'} streak`}
                  // Two-tone pill: name on the left in the neutral card colour,
                  // streak on the right in the user's accent. The seam between
                  // the two halves is a hard colour break (parent's
                  // rounded-full + overflow-hidden clips the inner spans to
                  // the chip's rounded outline).
                  className={`group inline-flex items-stretch overflow-hidden rounded-full bg-white text-sm font-semibold shadow-soft ring-1 transition-colors hover:bg-stone-50 dark:bg-stone-950 dark:hover:bg-stone-900 ${ring}`}
                >
                  <span className="inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 text-stone-800 dark:text-stone-100">
                    <span
                      aria-hidden="true"
                      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white dark:ring-stone-950 ${dot}`}
                    />
                    {user.name}
                  </span>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 px-2.5 py-1.5 text-sm font-semibold tabular-nums transition-colors ${streakBg}`}
                    title={streakActive ? `${streak} ${streak === 1 ? 'day' : 'days'} streak` : 'No active streak'}
                  >
                    <span aria-hidden="true">🔥</span>
                    {streak}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {/* Title on desktop only — on mobile the pills take the left slot. */}
        <span className="hidden text-sm font-semibold tracking-tight text-stone-800 dark:text-stone-100 md:inline">
          Plank &amp; Push-ups
        </span>
        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>
    </header>
  );
}
