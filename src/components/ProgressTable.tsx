import { forwardRef, useEffect, useRef } from 'react';

import { USERS } from '../config/users';
import {
  formatDateDisplay,
  formatDateISO,
  formatWeekday,
  groupDatesByMonth,
  todayISO,
} from '../lib/date';
import { ACCENT_DOT, ACCENT_LABEL, FALLBACK_DOT, type Accent } from '../lib/accent';
import { getResult, monthEntryCount } from '../lib/progress';
import { ResultCell } from './ResultCell';
import { ChevronDown, MonthBody, MonthSection, useMonthSection } from './MonthSection';
import type { UserId, YearProgress } from '../types/progress';

interface ProgressTableProps {
  progress: YearProgress;
  onSetResult: (userId: UserId, dateISO: string, value: number | null) => void;
  // Display / input formatters. The plank tracker passes time formatters
  // (`5`, `1:25`, `0:30`); the push-ups tracker passes integer ones. The
  // cell uses these for both display and edit-draft conversion so swapping
  // trackers is just two prop changes.
  formatValue: (value: number | null) => string;
  parseInput: (input: string) => number | null;
  inputPlaceholder: string;
  // Exercise name used in aria-labels (e.g. "plank", "push-ups").
  exerciseLabel: string;
}

interface RowProps {
  date: Date;
  dateISO: string;
  isToday: boolean;
  isPast: boolean;
  progress: YearProgress;
  onSetResult: (userId: UserId, dateISO: string, value: number | null) => void;
  formatValue: (value: number | null) => string;
  parseInput: (input: string) => number | null;
  inputPlaceholder: string;
  exerciseLabel: string;
}

const ProgressRow = forwardRef<HTMLTableRowElement, RowProps>(function ProgressRow(
  {
    date,
    dateISO,
    isToday,
    isPast,
    progress,
    onSetResult,
    formatValue,
    parseInput,
    inputPlaceholder,
    exerciseLabel,
  },
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
              onSave={(v) => onSetResult(user.id, dateISO, v)}
              formatValue={formatValue}
              parseInput={parseInput}
              inputPlaceholder={inputPlaceholder}
              variant="desktop"
              ariaLabel={`${exerciseLabel} result for ${user.name} on ${dateISO}`}
              disabled={isPast}
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
  {
    date,
    dateISO,
    isToday,
    isPast,
    progress,
    onSetResult,
    formatValue,
    parseInput,
    inputPlaceholder,
    exerciseLabel,
  },
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
                className={`flex w-16 items-center gap-1.5 text-xs font-medium ${
                  ACCENT_LABEL[user.accent satisfies Accent]
                }`}
              >
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    ACCENT_DOT[user.accent satisfies Accent] ?? FALLBACK_DOT
                  }`}
                />
                {user.name}
              </span>
              <ResultCell
                value={value}
                accent={user.accent}
                onSave={(v) => onSetResult(user.id, dateISO, v)}
                formatValue={formatValue}
                parseInput={parseInput}
                inputPlaceholder={inputPlaceholder}
                variant="compact"
                ariaLabel={`${exerciseLabel} result for ${user.name} on ${dateISO}`}
                disabled={isPast}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

// Month header row for the desktop table layout. Spans every column so the
// click target covers the full row width and the row looks like a single
// section divider instead of a left-aligned label.
function MonthHeaderRow({ progress }: { progress: YearProgress }) {
  const { group, collapsed, setCollapsed } = useMonthSection();
  const entryCount = monthEntryCount(progress, group.dates);
  const totalSlots = group.dates.length * USERS.length;

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
              {group.fullLabel}
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
function MonthHeaderCard({ progress }: { progress: YearProgress }) {
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

export function ProgressTable({
  progress,
  onSetResult,
  formatValue,
  parseInput,
  inputPlaceholder,
  exerciseLabel,
}: ProgressTableProps) {
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
  // On mobile the address bar collapses after first paint, which reflows
  // the viewport and resets scroll to top — so we re-assert the scroll a
  // few times across the first ~1.5s. Each attempt overrides the previous
  // one, so a stale scroll from an earlier tick is replaced by a fresh one.
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

  // Render the rows / cards for a single month. Used by both desktop table
  // and mobile card layouts — each calls this with its own per-row renderer.
  const renderMonthRows = (month: (typeof months)[number]) =>
    month.dates.map((date) => {
      const dateISO = formatDateISO(date);
      const isToday = dateISO === today;
      // ISO YYYY-MM-DD strings compare lexically the same as chronologically,
      // so a straight string compare is enough — no need to construct Dates
      // just to compare them.
      const isPast = dateISO < today;
      return (
        <ProgressRow
          key={dateISO}
          ref={isToday ? todayRowRef : undefined}
          date={date}
          dateISO={dateISO}
          isToday={isToday}
          isPast={isPast}
          progress={progress}
          onSetResult={onSetResult}
          formatValue={formatValue}
          parseInput={parseInput}
          inputPlaceholder={inputPlaceholder}
          exerciseLabel={exerciseLabel}
        />
      );
    });

  const renderMonthCards = (month: (typeof months)[number]) =>
    month.dates.map((date) => {
      const dateISO = formatDateISO(date);
      const isToday = dateISO === today;
      const isPast = dateISO < today;
      return (
        <DayCard
          key={dateISO}
          ref={isToday ? todayCardRef : undefined}
          date={date}
          dateISO={dateISO}
          isToday={isToday}
          isPast={isPast}
          progress={progress}
          onSetResult={onSetResult}
          formatValue={formatValue}
          parseInput={parseInput}
          inputPlaceholder={inputPlaceholder}
          exerciseLabel={exerciseLabel}
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
                <th
                  scope="col"
                  className="sticky left-0 z-30 bg-stone-50/95 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 dark:bg-stone-900/95 dark:text-stone-400"
                >
                  Date
                </th>
                {USERS.map((user) => (
                  <th
                    key={user.id}
                    scope="col"
                    className="border-l border-stone-300 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-stone-700 dark:border-stone-600 dark:text-stone-200"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          ACCENT_DOT[user.accent] ?? FALLBACK_DOT
                        }`}
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
