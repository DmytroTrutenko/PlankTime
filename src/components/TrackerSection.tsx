import type { ReactNode } from 'react';

import type { UseYearProgress } from '../hooks/useYearProgress';
import { ProgressTable } from './ProgressTable';
import { SummaryBar } from './SummaryBar';

interface TrackerSectionProps {
  title: string;
  hint: ReactNode;
  inputPlaceholder: string;
  formatValue: (value: number | null) => string;
  parseInput: (input: string) => number | null;
  tracker: UseYearProgress;
  exerciseLabel: string;
}

// One page of the app: heading + summary bar + year grid. The summary bar
// uses the same translucent pill on mobile and desktop so the colours match —
// the only viewport-dependent behaviour is `sticky` (mobile, where the page
// scrolls) vs `static` (desktop, where only the inner table scrolls).
export function TrackerSection({
  title,
  hint,
  inputPlaceholder,
  formatValue,
  parseInput,
  tracker,
  exerciseLabel,
}: TrackerSectionProps) {
  return (
    <section className="min-h-screen bg-gradient-to-b from-canvas/70 via-canvas/55 to-canvas-deep/70 px-4 pb-8 pt-6 sm:px-6 sm:pb-12 sm:pt-8 dark:from-canvas-night/70 dark:via-canvas-night/55 dark:to-black/75">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-ink-inverse sm:text-3xl">
            {title} — {tracker.progress.year}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{hint}</p>
        </header>

        {tracker.error && (
          <div
            role="alert"
            className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-200"
          >
            {tracker.error}
          </div>
        )}

        <div className="sticky top-14 z-30 mb-3 rounded-2xl bg-canvas/85 px-2 pt-2 pb-2 shadow-[0_2px_8px_-2px_rgb(0_0_0_/0.08)] backdrop-blur supports-[backdrop-filter]:bg-canvas/65 sm:px-3 md:static md:top-auto md:mb-6">
          <SummaryBar progress={tracker.progress} formatValue={formatValue} />
        </div>

        <ProgressTable
          progress={tracker.progress}
          onSetResult={tracker.setResult}
          formatValue={formatValue}
          parseInput={parseInput}
          inputPlaceholder={inputPlaceholder}
          exerciseLabel={exerciseLabel}
        />
      </div>
    </section>
  );
}
