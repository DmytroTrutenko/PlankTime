import { useState } from 'react';

import { useYearProgress } from './hooks/useYearProgress';
import { formatReps, formatSeconds, parseRepsInput, parseTimeInput } from './lib/date';
import { Header } from './components/Header';
import { ThemeToggle } from './components/ThemeToggle';
import { TrackerSection } from './components/TrackerSection';
import { SummaryModal } from './components/SummaryModal';
import type { UserId } from './types/progress';

const codeClass =
  'rounded bg-stone-200/70 px-1.5 py-0.5 font-mono text-xs text-stone-800 dark:bg-neutral-800 dark:text-neutral-200';

export default function App() {
  const tracker = useYearProgress();
  // Mobile opens the summary for a single user in an overlay. Null = closed.
  const [openSummaryUserId, setOpenSummaryUserId] = useState<UserId | null>(null);

  return (
    <>
      {/* Fixed full-page background photo. Sits below every section so the
          table sits on one cohesive backdrop. The dark overlay (defined in
          index.css via `.page-bg`) is uniform across viewports. */}
      <div aria-hidden="true" className="page-bg" />

      <Header
        rightSlot={<ThemeToggle />}
        onOpenSummary={setOpenSummaryUserId}
        progress={tracker.progress}
      />

      <main className="relative">
        <TrackerSection
          title="Plank & Push-ups"
          hint={
            <>
              Click a cell to log a result.{' '}
              <strong className="font-semibold text-stone-700 dark:text-stone-200">Plank</strong>{' '}
              — time as <code className={codeClass}>5</code> for 5 min,{' '}
              <code className={codeClass}>1:25</code> for 1 min 25 s, or{' '}
              <code className={codeClass}>0:30</code> for 30 s.{' '}
              <strong className="font-semibold text-stone-700 dark:text-stone-200">
                Push-ups
              </strong>{' '}
              — a whole number of reps, e.g. <code className={codeClass}>25</code>.
            </>
          }
          progress={tracker.progress}
          error={tracker.error}
          onSetResult={tracker.setResult}
          formatPlank={formatSeconds}
          formatPushups={formatReps}
          parsePlank={parseTimeInput}
          parsePushups={parseRepsInput}
        />
      </main>

      {openSummaryUserId && (
        <SummaryModal
          userId={openSummaryUserId}
          progress={tracker.progress}
          formatPlank={formatSeconds}
          formatPushups={formatReps}
          onClose={() => setOpenSummaryUserId(null)}
        />
      )}
    </>
  );
}
