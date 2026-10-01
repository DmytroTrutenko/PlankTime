import type { ReactNode } from 'react';

import { USERS } from '../config/users';
import { ACCENT_DOT, ACCENT_RING, FALLBACK_DOT, FALLBACK_RING } from '../lib/accent';
import type { UserId } from '../types/progress';

interface HeaderProps {
  rightSlot?: ReactNode;
  // Triggered on mobile when the user taps one of the user pills in the
  // header — opens the SummaryModal for that user. Hidden on md+ where the
  // summary lives inline above the table.
  onOpenSummary?: (userId: UserId) => void;
}

export function Header({ rightSlot, onOpenSummary }: HeaderProps) {
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
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onOpenSummary(user.id)}
                  aria-label={`Open ${user.name} summary`}
                  className={`inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-stone-800 shadow-soft ring-1 transition-colors hover:bg-stone-50 dark:bg-stone-950 dark:text-stone-100 dark:hover:bg-stone-900 ${ring}`}
                >
                  <span
                    aria-hidden="true"
                    className={`inline-block h-2 w-2 shrink-0 rounded-full ring-2 ring-white dark:ring-stone-950 ${dot}`}
                  />
                  {user.name}
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
