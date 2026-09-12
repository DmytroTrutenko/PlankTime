import { ProgressTable } from './components/ProgressTable';
import { SummaryBar } from './components/SummaryBar';
import { useYearProgress } from './hooks/useYearProgress';

export default function App() {
  const { progress, setResult } = useYearProgress();

  return (
    <div className="min-h-screen bg-gradient-to-b from-canvas to-canvas-deep dark:from-canvas-night dark:to-black">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-ink-inverse sm:text-3xl">
            Plank — {progress.year}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Click your cell to log a result. Enter time as{' '}
            <code className="rounded bg-stone-200/70 px-1.5 py-0.5 font-mono text-xs text-stone-800 dark:bg-neutral-800 dark:text-neutral-200">90</code>,{' '}
            <code className="rounded bg-stone-200/70 px-1.5 py-0.5 font-mono text-xs text-stone-800 dark:bg-neutral-800 dark:text-neutral-200">1:25</code> or{' '}
            <code className="rounded bg-stone-200/70 px-1.5 py-0.5 font-mono text-xs text-stone-800 dark:bg-neutral-800 dark:text-neutral-200">2:10</code>.
          </p>
        </header>

        <div className="mb-6">
          <SummaryBar progress={progress} />
        </div>

        <ProgressTable progress={progress} onSetResult={setResult} />

        <footer className="mt-6 text-center text-xs text-ink-soft">
          Synced to Supabase — shared across devices.
        </footer>
      </div>
    </div>
  );
}
