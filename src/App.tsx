import { useState } from 'react';

import { useYearPlank, useYearPushups } from './hooks/useYearProgress';
import { formatReps, formatSeconds, parseRepsInput, parseTimeInput } from './lib/date';
import { Header, type Page } from './components/Header';
import { ThemeToggle } from './components/ThemeToggle';
import { TrackerSection } from './components/TrackerSection';

const codeClass =
  'rounded bg-stone-200/70 px-1.5 py-0.5 font-mono text-xs text-stone-800 dark:bg-neutral-800 dark:text-neutral-200';

interface TrackerMeta {
  title: string;
  exerciseLabel: string;
  hint: React.ReactNode;
  inputPlaceholder: string;
  formatValue: (value: number | null) => string;
  parseInput: (input: string) => number | null;
}

const TRACKERS: Record<Page, TrackerMeta> = {
  plank: {
    title: 'Plank',
    exerciseLabel: 'plank',
    hint: (
      <>
        Click your cell to log a result. Enter time as <code className={codeClass}>5</code> for 5
        minutes, <code className={codeClass}>1:25</code> for 1 min 25 s, or{' '}
        <code className={codeClass}>0:30</code> for 30 s.
      </>
    ),
    inputPlaceholder: 'min or m:ss',
    formatValue: formatSeconds,
    parseInput: parseTimeInput,
  },
  pushups: {
    title: 'Push-ups',
    exerciseLabel: 'push-ups',
    hint: (
      <>
        Click your cell to log a result. Enter a whole number of reps (e.g.{' '}
        <code className={codeClass}>25</code>).
      </>
    ),
    inputPlaceholder: 'reps',
    formatValue: formatReps,
    parseInput: parseRepsInput,
  },
};

export default function App() {
  const plank = useYearPlank();
  const pushups = useYearPushups();
  const [page, setPage] = useState<Page>('plank');

  const tracker = page === 'plank' ? plank : pushups;
  const meta = TRACKERS[page];

  return (
    <>
      {/* Fixed full-page background photo. Sits below every section so the
          table sits on one cohesive backdrop. The dark overlay (defined in
          index.css via `.page-bg`) is uniform across viewports. */}
      <div aria-hidden="true" className="page-bg" />

      <Header active={page} onChange={setPage} rightSlot={<ThemeToggle />} />

      <main className="relative">
        <TrackerSection
          key={page}
          title={meta.title}
          hint={meta.hint}
          inputPlaceholder={meta.inputPlaceholder}
          formatValue={meta.formatValue}
          parseInput={meta.parseInput}
          tracker={tracker}
          exerciseLabel={meta.exerciseLabel}
        />
      </main>
    </>
  );
}
