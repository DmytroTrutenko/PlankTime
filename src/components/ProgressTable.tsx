import { createContext, forwardRef, useContext, useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';

import { USERS } from '../config/users';
import {
  formatDateDisplay,
  formatDateISO,
  formatSeconds,
  formatWeekday,
  groupDatesByMonth,
  parseTimeInput,
  todayISO,
  type MonthGroup,
} from '../lib/date';
import { getResult, monthEntryCount } from '../lib/progress';
import type { UserId, YearProgress } from '../types/progress';

interface ProgressTableProps {
  progress: YearProgress;
  onSetResult: (userId: UserId, dateISO: string, seconds: number | null) => void;
}

// Single source of truth for cell typography + padding — applied to the SAME
// outer <div> for both display and edit states so swapping between them
// cannot change the visual size of the cell content. Using a <div> instead of
// <button> eliminates UA button defaults entirely (Tailwind preflight is off
// here, so border / background would otherwise leak through). Colour is set
// on the wrapper (not on the inner <input>), because with preflight off some
// browsers apply a UA <input> colour that wins the cascade over Tailwind
// utility classes and renders the digits white-on-white in light mode.
const CELL_BOX =
  'flex h-full w-full items-center justify-center border-0 bg-transparent px-3 py-2 ' +
  'font-mono text-sm tabular-nums leading-5 transition-colors duration-150 ' +
  'appearance-none select-none';

const ACCENT_BG_HOVER: Record<string, string> = {
  sky: 'hover:bg-sky-50 focus-within:bg-sky-50 dark:hover:bg-sky-950/40 dark:focus-within:bg-sky-950/50',
  rose: 'hover:bg-rose-50 focus-within:bg-rose-50 dark:hover:bg-rose-950/40 dark:focus-within:bg-rose-950/50',
};

const ACCENT_DOT: Record<string, string> = {
  sky: 'bg-sky-500',
  rose: 'bg-rose-500',
};

const ACCENT_LABEL: Record<string, string> = {
  sky: 'text-sky-700 dark:text-sky-300',
  rose: 'text-rose-700 dark:text-rose-300',
};

interface CellProps {
  value: number | null;
  accent: string;
  onSave: (seconds: number | null) => void;
}

// Always render an <input>. In display mode it is `readOnly`, in edit mode
// it becomes editable. Because the element type never changes between states,
// the cell cannot shift on focus — there is no span → input swap. The
// `caret-color: transparent` keeps the text caret hidden while readOnly so
// the field visually looks like plain text, not an input.
function ResultCell({ value, accent, onSave }: CellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    if (editing) return;
    setDraft(value != null ? formatSeconds(value) : '');
    setEditing(true);
  };

  const commit = () => {
    onSave(parseTimeInput(draft));
    setEditing(false);
  };

  const cancel = () => {
    setDraft('');
    setEditing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
    }
  };

  const isEmpty = value == null;
  const valueText = formatSeconds(value);

  return (
    <div
      className={`${CELL_BOX} ${ACCENT_BG_HOVER[accent] ?? ''} ${
        isEmpty
          ? 'font-normal text-stone-400 dark:text-stone-500'
          : 'font-semibold text-stone-800 dark:text-stone-100'
      }`}
    >
      <input
        ref={inputRef}
        type="text"
        readOnly={!editing}
        value={editing ? draft : valueText}
        onClick={startEdit}
        onFocus={startEdit}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder={editing ? 'm:ss' : '—'}
        inputMode={editing ? 'numeric' : undefined}
        autoComplete="off"
        enterKeyHint="done"
        // `touch-action: manipulation` removes the 300 ms tap delay and stops
        // double-tap zoom on mobile so the cell never grows on tap. Colour is
        // intentionally NOT set here — it comes from the wrapper above via
        // `color: inherit` in INPUT_RESET_STYLE so UA <input> styles can't
        // override it.
        className={
          'block w-full min-w-0 touch-manipulation appearance-none border-0 bg-transparent text-center ' +
          'outline-none focus:outline-none focus:ring-0 ' +
          'cursor-pointer ' +
          (isEmpty ? 'font-normal' : 'font-semibold')
        }
        style={editing ? INPUT_RESET_STYLE : INPUT_READONLY_STYLE}
      />
    </div>
  );
}

// Hard reset on the input — guarantees no UA default outline / border /
// shadow / padding / background leaks in and shifts the layout on focus.
// font-size 14px matches Tailwind's `text-sm` so the rendered glyphs sit at
// the same baseline as the <span> shown in display mode. `color: 'inherit'`
// is defensive: with Tailwind's preflight disabled here, some browsers apply
// their own (sometimes white-on-white) UA colour to <input> that can override
// utility classes in the cascade.
const INPUT_RESET_STYLE: CSSProperties = {
  fontSize: '14px',
  lineHeight: '20px',
  padding: '0',
  margin: '0',
  border: 'none',
  outline: 'none',
  boxShadow: 'none',
  background: 'transparent',
  color: 'inherit',
  WebkitAppearance: 'none',
  appearance: 'none',
};

// Same reset, but with the caret hidden so a readOnly input visually looks
// like plain text instead of an input that can blink / receive focus rings.
const INPUT_READONLY_STYLE: CSSProperties = {
  ...INPUT_RESET_STYLE,
  caretColor: 'transparent',
};

// Compact button that doubles as a display + tap-to-edit field for the mobile cards.
// Same always-render-input pattern as the desktop cell: a single <input> toggles
// readOnly on focus, so the element type never changes between display and edit
// states — no width / height jump on focus.
function CompactResultCell({
  value,
  onSave,
}: {
  value: number | null;
  onSave: (seconds: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    if (editing) return;
    setDraft(value != null ? formatSeconds(value) : '');
    setEditing(true);
  };

  const commit = () => {
    onSave(parseTimeInput(draft));
    setEditing(false);
  };

  const cancel = () => {
    setDraft('');
    setEditing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
    }
  };

  const isEmpty = value == null;

  return (
    <div
      className={`flex h-9 w-full items-center justify-center rounded-lg transition-colors appearance-none ${
        editing
          ? 'bg-stone-100 px-2 text-stone-800 dark:bg-stone-800 dark:text-stone-100'
          : isEmpty
            ? 'bg-stone-100 text-stone-400 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-500 dark:hover:bg-stone-700'
            : 'bg-white text-stone-800 ring-1 ring-stone-300/80 hover:bg-stone-50 dark:bg-stone-800 dark:text-stone-100 dark:ring-stone-600/80 dark:hover:bg-stone-700'
      }`}
    >
      <input
        ref={inputRef}
        type="text"
        readOnly={!editing}
        value={editing ? draft : formatSeconds(value)}
        onClick={startEdit}
        onFocus={startEdit}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder={editing ? 'm:ss' : '—'}
        inputMode={editing ? 'numeric' : undefined}
        autoComplete="off"
        enterKeyHint="done"
        // Colour is intentionally NOT set here — it comes from the wrapper
        // above via `color: inherit` in INPUT_RESET_STYLE so UA <input>
        // styles can't override it.
        className="block w-full min-w-0 touch-manipulation appearance-none border-0 bg-transparent text-center outline-none focus:outline-none focus:ring-0 font-mono text-sm leading-5 font-semibold tabular-nums"
        style={editing ? INPUT_RESET_STYLE : INPUT_READONLY_STYLE}
      />
    </div>
  );
}

interface RowProps {
  date: Date;
  dateISO: string;
  isToday: boolean;
  progress: YearProgress;
  onSetResult: (userId: UserId, dateISO: string, seconds: number | null) => void;
}

const ProgressRow = forwardRef<HTMLTableRowElement, RowProps>(function ProgressRow(
  { date, dateISO, isToday, progress, onSetResult },
  ref,
) {
  return (
    <tr
      ref={ref}
      className={`border-b border-stone-300 transition-colors dark:border-stone-700 ${
        isToday
          ? 'bg-amber-50/60 dark:bg-amber-950/20'
          : 'hover:bg-stone-50/60 dark:hover:bg-stone-900/40'
      }`}
    >
      <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5">
        <div className="flex items-baseline gap-2">
          <span
            className={`font-medium ${
              isToday ? 'text-amber-900 dark:text-amber-200' : 'text-stone-800 dark:text-stone-100'
            }`}
          >
            {formatDateDisplay(date)}
          </span>
          <span
            className={`text-xs ${
              isToday ? 'text-amber-700 dark:text-amber-400' : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            {formatWeekday(date)}
          </span>
          {isToday && (
            <span className="ml-1 rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900 dark:bg-amber-800 dark:text-amber-100">
              today
            </span>
          )}
        </div>
      </td>

      {USERS.map((user) => {
        const value = getResult(progress, user.id, dateISO);
        return (
          <td
            key={user.id}
            className="border-l border-stone-300 p-0 align-middle dark:border-stone-600"
          >
            <ResultCell
              value={value}
              accent={user.accent}
              onSave={(seconds) => onSetResult(user.id, dateISO, seconds)}
            />
          </td>
        );
      })}
    </tr>
  );
});

// One card per day for the mobile (<md) layout — shows the date, weekday,
// and one button per user stacked vertically.
const DayCard = forwardRef<HTMLDivElement, RowProps>(function DayCard(
  { date, dateISO, isToday, progress, onSetResult },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`rounded-xl border p-3 transition-colors ${
        isToday
          ? 'border-amber-300/80 bg-amber-50/60 dark:border-amber-700/70 dark:bg-amber-950/20'
          : 'border-stone-300/80 bg-white dark:border-stone-700/80 dark:bg-stone-900'
      }`}
    >
      <div className="mb-2 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-sm font-medium ${
              isToday ? 'text-amber-900 dark:text-amber-200' : 'text-stone-800 dark:text-stone-100'
            }`}
          >
            {formatDateDisplay(date)}
          </span>
          <span
            className={`text-xs ${
              isToday ? 'text-amber-700 dark:text-amber-400' : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            {formatWeekday(date)}
          </span>
        </div>
        {isToday && (
          <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900 dark:bg-amber-800 dark:text-amber-100">
            today
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {USERS.map((user) => {
          const value = getResult(progress, user.id, dateISO);
          return (
            <div key={user.id} className="flex items-center gap-2">
              <span
                className={`flex w-16 items-center gap-1.5 text-xs font-medium ${ACCENT_LABEL[user.accent] ?? ''}`}
              >
                <span
                  className={`inline-block h-2 w-2 rounded-full ${ACCENT_DOT[user.accent] ?? 'bg-stone-400'}`}
                />
                {user.name}
              </span>
              <CompactResultCell
                value={value}
                onSave={(seconds) => onSetResult(user.id, dateISO, seconds)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

// Chevron SVG used by the month accordion. Rotated by CSS rather than swapping
// the path so the icon geometry stays stable across toggles.
function ChevronDown({ className = '' }: { className?: string }) {
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

interface MonthSectionProps {
  group: MonthGroup;
  defaultCollapsed: boolean;
  children: ReactNode;
}

// Shared month-section wrapper that tracks collapsed state and renders a
// single children block. Each instance owns its own collapsed state so
// toggling one month doesn't affect any other.
function MonthSection({ group, defaultCollapsed, children }: MonthSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <MonthSectionContext.Provider value={{ collapsed, setCollapsed, group }}>
      {children}
    </MonthSectionContext.Provider>
  );
}

// Month header row for the desktop table layout. Spans every column so the
// click target covers the full row width and the row looks like a single
// section divider instead of a left-aligned label.
function MonthHeaderRow({
  progress,
}: {
  progress: YearProgress;
}) {
  const { group, collapsed, setCollapsed } = useMonthSection();
  const entryCount = monthEntryCount(progress, group.dates);
  const totalSlots = group.dates.length * USERS.length;
  const monthLabel = group.fullLabel;

  return (
    <tr className="border-y border-stone-300 bg-stone-100/80 dark:border-stone-600 dark:bg-stone-800/60">
      <td colSpan={USERS.length + 1} className="p-0">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
          aria-controls={`month-${group.year}-${group.month}`}
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-stone-200/70 dark:hover:bg-stone-700/60"
        >
          <span className="flex items-baseline gap-3">
            <span className="text-sm font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-200">
              {monthLabel}
            </span>
            {group.isCurrent && (
              <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                current
              </span>
            )}
            <span className="text-xs tabular-nums text-stone-500 dark:text-stone-400">
              {entryCount} / {totalSlots}
            </span>
          </span>
          <ChevronDown
            className={`shrink-0 text-stone-500 transition-transform duration-200 dark:text-stone-400 ${
              collapsed ? '' : 'rotate-180'
            }`}
          />
        </button>
      </td>
    </tr>
  );
}

// Month header divider for the mobile card layout. Full-width click target
// sitting between card groups.
function MonthHeaderCard({
  progress,
}: {
  progress: YearProgress;
}) {
  const { group, collapsed, setCollapsed } = useMonthSection();
  const entryCount = monthEntryCount(progress, group.dates);
  const totalSlots = group.dates.length * USERS.length;

  return (
    <button
      type="button"
      onClick={() => setCollapsed(!collapsed)}
      aria-expanded={!collapsed}
      className="flex w-full items-center justify-between gap-2 rounded-xl border border-stone-300/80 bg-stone-100/80 px-3 py-2 text-left transition-colors hover:bg-stone-200/70 dark:border-stone-700/80 dark:bg-stone-800/60 dark:hover:bg-stone-700/60"
    >
      <span className="flex items-baseline gap-3">
        <span className="text-sm font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-200">
          {group.fullLabel}
        </span>
        {group.isCurrent && (
          <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900 dark:bg-amber-800 dark:text-amber-100">
            current
          </span>
        )}
      </span>
      <span className="flex items-center gap-2">
        <span className="text-xs tabular-nums text-stone-500 dark:text-stone-400">
          {entryCount} / {totalSlots}
        </span>
        <ChevronDown
          className={`shrink-0 text-stone-500 transition-transform duration-200 dark:text-stone-400 ${
            collapsed ? '' : 'rotate-180'
          }`}
        />
      </span>
    </button>
  );
}

// Wraps the children of a month section so it can be conditionally rendered
// (i.e. unmounted entirely when collapsed) without breaking surrounding
// table-row layout. Renders an empty fragment when collapsed.
function MonthBody({ children }: { children: ReactNode }) {
  const { collapsed } = useMonthSection();
  if (collapsed) return null;
  return <>{children}</>;
}

export function ProgressTable({ progress, onSetResult }: ProgressTableProps) {
  const months = groupDatesByMonth(progress.year);
  const today = todayISO();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const todayRowRef = useRef<HTMLTableRowElement | null>(null);
  const todayCardRef = useRef<HTMLDivElement | null>(null);

  // Scroll today's row / card to the centre of its scroll container on first
  // mount. We branch by viewport so the hidden layout doesn't get queried:
  //   - Desktop (>= md): the row lives inside the inner overflow-auto div, so
  //     we adjust container.scrollTop to centre the row vertically.
  //   - Mobile (< md): cards are stacked in the page itself, so we scroll
  //     document.scrollingElement explicitly.
  // On mobile the address bar collapses after first paint, which reflows the
  // viewport and resets scroll to top — so we re-assert the scroll a few
  // times across the first ~1.5s. Each attempt overrides the previous one,
  // so a stale scroll from an earlier tick is replaced by a fresh one.
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    let cancelled = false;

    const tryScroll = (): void => {
      if (cancelled) return;

      const isDesktop = window.matchMedia('(min-width: 768px)').matches;

      if (isDesktop) {
        const row = todayRowRef.current;
        const container = scrollContainerRef.current;
        if (row && container) {
          const containerHeight = container.clientHeight;
          const rowTop = row.offsetTop;
          const rowHeight = row.offsetHeight;
          if (rowHeight > 0 && containerHeight > 0) {
            const target = Math.max(0, rowTop - (containerHeight - rowHeight) / 2);
            container.scrollTop = target;
          }
        }
      } else {
        const card = todayCardRef.current;
        if (card) {
          const rect = card.getBoundingClientRect();
          if (rect.height > 0) {
            const absoluteTop = window.scrollY + rect.top;
            const target = absoluteTop - (window.innerHeight - rect.height) / 2;
            const clamped = Math.max(0, target);
            // Write to both documentElement and body — covers standards and
            // quirks mode and is robust across mobile browsers.
            document.documentElement.scrollTop = clamped;
            document.body.scrollTop = clamped;
          }
        }
      }
    };

    const rafId = requestAnimationFrame(tryScroll);
    const onLoad = () => tryScroll();
    window.addEventListener('load', onLoad);
    // Cover address-bar collapse (~300-500ms after load) and the late layout
    // shift that follows (~1-1.5s). Each one re-asserts today so any reset
    // back to top in between is undone.
    const t1 = window.setTimeout(tryScroll, 400);
    const t2 = window.setTimeout(tryScroll, 1200);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('load', onLoad);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  // Render the rows / cards for a single month. Used by both desktop table and
  // mobile card layouts — each calls this with its own per-row renderer.
  const renderMonthRows = (month: MonthGroup) =>
    month.dates.map((date) => {
      const dateISO = formatDateISO(date);
      const isToday = dateISO === today;
      return (
        <ProgressRow
          key={dateISO}
          ref={isToday ? todayRowRef : undefined}
          date={date}
          dateISO={dateISO}
          isToday={isToday}
          progress={progress}
          onSetResult={onSetResult}
        />
      );
    });

  const renderMonthCards = (month: MonthGroup) =>
    month.dates.map((date) => {
      const dateISO = formatDateISO(date);
      const isToday = dateISO === today;
      return (
        <DayCard
          key={dateISO}
          ref={dateISO === today ? todayCardRef : undefined}
          date={date}
          dateISO={dateISO}
          isToday={isToday}
          progress={progress}
          onSetResult={onSetResult}
        />
      );
    });

  return (
    <>
      {/* Desktop / tablet: classic table. */}
      <div className="hidden overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-stone-300/80 md:block dark:bg-stone-950 dark:ring-stone-600/80">
        <div ref={scrollContainerRef} className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead className="sticky top-0 z-20 bg-stone-50/95 backdrop-blur dark:bg-stone-900/95">
              <tr className="border-b border-stone-300 dark:border-stone-600">
                <th className="sticky left-0 z-30 bg-stone-50/95 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:bg-stone-900/95 dark:text-stone-400">
                  Date
                </th>
                {USERS.map((user) => (
                  <th
                    key={user.id}
                    className="border-l border-stone-300 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-stone-700 dark:border-stone-600 dark:text-stone-200"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${ACCENT_DOT[user.accent] ?? 'bg-stone-400'}`}
                      />
                      {user.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {months.map((month) => {
                // Auto-collapse completed months; keep the current month and
                // any future months expanded so the user can pre-fill them.
                const defaultCollapsed = month.isCompleted;
                return (
                  <MonthSection
                    key={`${month.year}-${month.month}`}
                    group={month}
                    defaultCollapsed={defaultCollapsed}
                  >
                    <MonthHeaderRow progress={progress} />
                    <MonthBody>{renderMonthRows(month)}</MonthBody>
                  </MonthSection>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: one card per day, grouped by collapsible month. */}
      <div className="space-y-2 md:hidden">
        {months.map((month) => {
          const defaultCollapsed = month.isCompleted;
          return (
            <MonthSection
              key={`${month.year}-${month.month}`}
              group={month}
              defaultCollapsed={defaultCollapsed}
            >
              <MonthHeaderCard progress={progress} />
              <MonthBody>
                <div className="mt-2 space-y-2">{renderMonthCards(month)}</div>
              </MonthBody>
            </MonthSection>
          );
        })}
      </div>
    </>
  );
}