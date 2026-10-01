import type { ReactNode } from 'react';

export type Page = 'plank' | 'pushups';

interface HeaderProps {
  active: Page;
  onChange: (page: Page) => void;
  rightSlot?: ReactNode;
}

const TABS: ReadonlyArray<{ id: Page; label: string }> = [
  { id: 'plank', label: 'Plank' },
  { id: 'pushups', label: 'Push-ups' },
];

export function Header({ active, onChange, rightSlot }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 h-14 bg-canvas/85 backdrop-blur supports-[backdrop-filter]:bg-canvas/70 dark:bg-canvas-night/85 dark:supports-[backdrop-filter]:bg-canvas-night/70">
      <div className="mx-auto flex h-full max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
        <nav className="flex items-center gap-1 rounded-full bg-stone-200/70 p-1 dark:bg-stone-800/80">
          {TABS.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                aria-pressed={isActive}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-stone-900 shadow-soft dark:bg-stone-700 dark:text-stone-50'
                    : 'text-stone-700 hover:bg-white/70 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-700/70 dark:hover:text-stone-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>
    </header>
  );
}
