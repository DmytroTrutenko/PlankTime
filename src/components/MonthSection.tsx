import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

import type { MonthGroup } from '../lib/date';

interface MonthSectionContextValue {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  group: MonthGroup;
}

const MonthSectionContext = createContext<MonthSectionContextValue | null>(null);

function useMonthSection(): MonthSectionContextValue {
  const ctx = useContext(MonthSectionContext);
  if (!ctx) throw new Error('useMonthSection must be used inside MonthSection');
  return ctx;
}

export function MonthSection({
  group,
  defaultCollapsed,
  children,
}: {
  group: MonthGroup;
  defaultCollapsed: boolean;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <MonthSectionContext.Provider value={{ collapsed, setCollapsed, group }}>
      {children}
    </MonthSectionContext.Provider>
  );
}

export function MonthBody({ children }: { children: ReactNode }) {
  const { collapsed } = useMonthSection();
  if (collapsed) return null;
  return <>{children}</>;
}

// Chevron SVG used by the month accordion. Rotated by CSS rather than
// swapping the path so the icon geometry stays stable across toggles.
export function ChevronDown({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { useMonthSection };
