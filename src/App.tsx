import { ProgressTable } from './components/ProgressTable';
import { SummaryBar } from './components/SummaryBar';
import { useYearProgress } from './hooks/useYearProgress';

export default function App() {
  const { progress, setResult } = useYearProgress();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Plank — {progress.year}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Click your cell to log a result. Enter time as{' '}
            <code className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs">90</code>,{' '}
            <code className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs">1:25</code> or{' '}
            <code className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs">2:10</code>.
          </p>
        </header>

        <div className="mb-6">
          <SummaryBar progress={progress} />
        </div>

        <ProgressTable progress={progress} onSetResult={setResult} />

        <footer className="mt-6 text-center text-xs text-slate-400">
          Synced to Supabase — shared across devices.
        </footer>
      </div>
    </div>
  );
}