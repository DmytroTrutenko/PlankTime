import { forwardRef, useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';

import { USERS } from '../config/users';
import {
  formatDateDisplay,
  formatDateISO,
  formatSeconds,
  formatWeekday,
  generateYearDates,
  parseTimeInput,
  todayISO,
} from '../lib/date';
import { getResult } from '../lib/progress';
import type { UserId, YearProgress } from '../types/progress';

interface ProgressTableProps {
  progress: YearProgress;
  onSetResult: (userId: UserId, dateISO: string, seconds: number | null) => void;
}

// Single source of truth for cell typography + padding — applied to the SAME
// outer <div> for both display and edit states so swapping between them
// cannot change the visual size of the cell content. Using a <div> instead of
// <button> eliminates UA button defaults entirely (Tailwind preflight is off
// here, so border / background would otherwise leak through).
const CELL_BOX =
  'flex h-full w-full items-center justify-center border-0 bg-transparent px-3 py-2 ' +
  'font-mono text-sm tabular-nums leading-5 transition-colors duration-150 ' +
  'appearance-none select-none';

// Width-filling child for both states — keeps the "clickable area" the same
// width whether the user is viewing or editing. `block w-full` overrides the
// flex item's content-based main-size so it stretches like the input does.
const CELL_INNER =
  'block w-full text-center font-mono text-sm leading-5 tabular-nums ' +
  'text-stone-800 dark:text-stone-100';

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
    setDraft(value != null ? formatSeconds(value) : '');
    setEditing(true);
  };

  const commit = () => {
    onSave(parseTimeInput(draft));
    setEditing(false);
  };

  const cancel = () => {
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

  if (!editing) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={startEdit}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            startEdit();
          }
        }}
        className={`group cursor-pointer outline-none focus:outline-none ${CELL_BOX} ${ACCENT_BG_HOVER[accent] ?? ''}`}
      >
        <span
          className={
            CELL_INNER +
            ' ' +
            (value == null
              ? 'font-normal text-stone-300 group-hover:text-stone-400 dark:text-stone-600 dark:group-hover:text-stone-500'
              : 'font-semibold')
          }
        >
          {formatSeconds(value)}
        </span>
      </div>
    );
  }

  return (
    <div className={`${CELL_BOX} ${ACCENT_BG_HOVER[accent] ?? 'bg-stone-50 dark:bg-stone-900/40'}`}>
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder="m:ss"
        inputMode="numeric"
        autoComplete="off"
        enterKeyHint="done"
        className="block w-full min-w-0 appearance-none border-0 bg-transparent text-center font-semibold text-stone-800 outline-none focus:outline-none focus:ring-0 dark:text-stone-100"
        style={INPUT_RESET_STYLE}
      />
    </div>
  );
}

// Hard reset on the input — guarantees no UA default outline / border /
// shadow / padding / background leaks in and shifts the layout on focus.
// font-size 14px matches Tailwind's `text-sm` so the rendered glyphs sit at
// the same baseline as the <span> shown in display mode.
const INPUT_RESET_STYLE: CSSProperties = {
  fontSize: '14px',
  lineHeight: '20px',
  padding: '0',
  margin: '0',
  border: 'none',
  outline: 'none',
  boxShadow: 'none',
  background: 'transparent',
  WebkitAppearance: 'none',
  appearance: 'none',
};

// Compact button that doubles as a display + tap-to-edit field for the mobile cards.
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
    setDraft(value != null ? formatSeconds(value) : '');
    setEditing(true);
  };

  const commit = () => {
    onSave(parseTimeInput(draft));
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
    }
  };

  if (editing) {
    return (
      <div className="flex h-9 w-full items-center justify-center rounded-lg bg-stone-100 px-2 dark:bg-stone-800">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          placeholder="m:ss"
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="done"
          autoFocus
          className="w-full min-w-0 appearance-none border-0 bg-transparent text-center font-mono text-sm leading-5 font-semibold tabular-nums text-stone-800 outline-none focus:outline-none focus:ring-0 dark:text-stone-100"
          style={INPUT_RESET_STYLE}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className={`flex h-9 w-full items-center justify-center rounded-lg border-0 font-mono text-sm leading-5 font-semibold tabular-nums transition-colors appearance-none ${
        value == null
          ? 'bg-stone-100 text-stone-400 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-500 dark:hover:bg-stone-700'
          : 'bg-white text-stone-800 ring-1 ring-stone-200/70 hover:bg-stone-50 dark:bg-stone-800 dark:text-stone-100 dark:ring-stone-700/60 dark:hover:bg-stone-700'
      }`}
    >
      {formatSeconds(value)}
    </button>
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
      className={`border-b border-stone-200/70 transition-colors dark:border-stone-700/60 ${
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
            className="border-l border-stone-200/80 p-0 align-middle dark:border-stone-700/70"
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
function DayCard({
  date,
  dateISO,
  isToday,
  progress,
  onSetResult,
}: RowProps) {
  return (
    <div
      className={`rounded-xl border p-3 transition-colors ${
        isToday
          ? 'border-amber-200/70 bg-amber-50/60 dark:border-amber-800/60 dark:bg-amber-950/20'
          : 'border-stone-200/70 bg-white dark:border-stone-800 dark:bg-stone-900'
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
}

export function ProgressTable({ progress, onSetResult }: ProgressTableProps) {
  const dates = generateYearDates(progress.year);
  const today = todayISO();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const todayRowRef = useRef<HTMLTableRowElement | null>(null);
  const didInitialScroll = useRef(false);

  // Scroll the today row to the centre of the inner scroll container on first
  // mount. `scrollIntoView` walks up to the nearest scrollable ancestor, which
  // is the overflow-auto div that wraps the table.
  useEffect(() => {
    if (didInitialScroll.current) return;
    if (!todayRowRef.current) return;
    didInitialScroll.current = true;

    // Defer one frame so layout has settled before we read positions.
    const raf = requestAnimationFrame(() => {
      const row = todayRowRef.current;
      const container = scrollContainerRef.current;
      if (!row || !container) return;

      const containerHeight = container.clientHeight;
      const rowTop = row.offsetTop;
      const rowHeight = row.offsetHeight;
      const target = Math.max(0, rowTop - (containerHeight - rowHeight) / 2);
      container.scrollTop = target;
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      {/* Desktop / tablet: classic table. */}
      <div className="hidden overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-stone-200/70 md:block dark:bg-stone-950 dark:ring-stone-700/70">
        <div ref={scrollContainerRef} className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead className="sticky top-0 z-20 bg-stone-50/95 backdrop-blur dark:bg-stone-900/95">
              <tr className="border-b border-stone-200 dark:border-stone-700">
                <th className="sticky left-0 z-30 bg-stone-50/95 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:bg-stone-900/95 dark:text-stone-400">
                  Date
                </th>
                {USERS.map((user) => (
                  <th
                    key={user.id}
                    className="border-l border-stone-200 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-stone-700 dark:border-stone-700 dark:text-stone-200"
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
              {dates.map((date) => {
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
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: one card per day. */}
      <div className="space-y-2 md:hidden">
        {dates.map((date) => {
          const dateISO = formatDateISO(date);
          return (
            <DayCard
              key={dateISO}
              date={date}
              dateISO={dateISO}
              isToday={dateISO === today}
              progress={progress}
              onSetResult={onSetResult}
            />
          );
        })}
      </div>
    </>
  );
}
