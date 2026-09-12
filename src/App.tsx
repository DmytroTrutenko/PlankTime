import { ProgressTable } from './components/ProgressTable';
import { SummaryBar } from './components/SummaryBar';
import { ThemeToggle } from './components/ThemeToggle';
import { useYearProgress } from './hooks/useYearProgress';

export default function App() {
  const { progress, setResult } = useYearProgress();

  return (
    <div className="min-h-screen bg-gradient-to-b from-canvas to-canvas-deep dark:from-canvas-night dark:to-black">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-ink-inverse sm:text-3xl">
              Plank — {progress.year}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Click your cell to log a result. Enter time as{' '}
              <code className="rounded bg-stone-200/70 px-1.5 py-0.5 font-mono text-xs text-stone-800 dark:bg-neutral-800 dark:text-neutral-200">5</code>
              {' '}for 5 minutes,{' '}
              <code className="rounded bg-stone-200/70 px-1.5 py-0.5 font-mono text-xs text-stone-800 dark:bg-neutral-800 dark:text-neutral-200">1:25</code>{' '}
              for 1 min 25 s, or{' '}
              <code className="rounded bg-stone-200/70 px-1.5 py-0.5 font-mono text-xs text-stone-800 dark:bg-neutral-800 dark:text-neutral-200">0:30</code>{' '}
              for 30 s.
            </p>
          </div>
          <div className="shrink-0 pt-1">
            <ThemeToggle />
          </div>
        </header>

        {/* Sticky on mobile so the stats stay reachable while scrolling the
            long list of days. md+ lets the bar sit in the normal flow instead
            of floating over content. Negative margin is intentionally NOT used
            here — bleeding past the parent's px-4 would let content extend to
            the viewport edge and any inner overflow would push the whole bar
            off-screen on narrow viewports. */}
        <div className="sticky top-0 z-30 mb-3 rounded-2xl bg-canvas/85 px-2 pt-2 pb-2 shadow-[0_2px_8px_-2px_rgb(0_0_0_/0.08)] backdrop-blur supports-[backdrop-filter]:bg-canvas/65 sm:px-3 md:static md:mb-6 md:bg-transparent md:px-0 md:pt-0 md:pb-0 md:shadow-none md:backdrop-blur-0 md:supports-[backdrop-filter]:bg-transparent">
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
