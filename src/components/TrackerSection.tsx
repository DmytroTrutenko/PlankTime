import type { ReactNode } from 'react';

import type { UserId, YearProgress } from '../types/progress';
import { ProgressTable } from './ProgressTable';
import { SummaryBar } from './SummaryBar';

interface TrackerSectionProps {
  title: string;
  hint: ReactNode;
  progress: YearProgress;
  error: string | null;
  onSetResult: (userId: UserId, dateISO: string, exercise: 'plank' | 'pushups', value: number | null) => void;
  formatPlank: (value: number | null) => string;
  formatPushups: (value: number | null) => string;
  parsePlank: (input: string) => number | null;
  parsePushups: (input: string) => number | null;
}

// One page of the app: heading + summary bar + year grid. The summary bar
// renders inline on desktop (md+); on mobile it lives in a modal opened by
// the header pills, so this section just doesn't render it there. The
// sticky behaviour was dropped — the mobile header pills + modal replace it.
export function TrackerSection({
  title,
  hint,
  progress,
  error,
  onSetResult,
  formatPlank,
  formatPushups,
  parsePlank,
  parsePushups,
}: TrackerSectionProps) {
  return (
    <section className="min-h-screen bg-gradient-to-b from-canvas/70 via-canvas/55 to-canvas-deep/70 px-4 pb-8 pt-6 sm:px-6 sm:pb-12 sm:pt-8 dark:from-canvas-night/70 dark:via-canvas-night/55 dark:to-black/75">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-ink-inverse sm:text-3xl">
            {title} — {progress.year}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{hint}</p>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-200"
          >
            {error}
          </div>
        )}

        <div className="mb-6 hidden md:block">
          <SummaryBar
            progress={progress}
            formatPlank={formatPlank}
            formatPushups={formatPushups}
          />
        </div>

        <ProgressTable
          progress={progress}
          onSetResult={onSetResult}
          formatPlank={formatPlank}
          formatPushups={formatPushups}
          parsePlank={parsePlank}
          parsePushups={parsePushups}
        />
      </div>
    </section>
  );
}