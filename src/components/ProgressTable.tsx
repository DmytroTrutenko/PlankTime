import { useEffect, useRef, useState } from 'react';
import { TextField } from '@mui/material';
import type { KeyboardEvent } from 'react';

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

interface CellProps {
  value: number | null;
  accent: string;
  onSave: (seconds: number | null) => void;
}

const ACCENT_BG_HOVER: Record<string, string> = {
  sky: 'hover:bg-sky-50/70 focus-within:bg-sky-50 dark:hover:bg-sky-900/30 dark:focus-within:bg-sky-900/40',
  rose: 'hover:bg-rose-50/70 focus-within:bg-rose-50 dark:hover:bg-rose-900/30 dark:focus-within:bg-rose-900/40',
};

const ACCENT_RING_FOCUS: Record<string, string> = {
  sky: 'ring-sky-300/70 dark:ring-sky-700/70',
  rose: 'ring-rose-300/70 dark:ring-rose-700/70',
};

const ACCENT_DOT: Record<string, string> = {
  sky: 'bg-sky-500',
  rose: 'bg-rose-500',
};

const ACCENT_LABEL: Record<string, string> = {
  sky: 'text-sky-700 dark:text-sky-300',
  rose: 'text-rose-700 dark:text-rose-300',
};

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
    const parsed = parseTimeInput(draft);
    onSave(parsed);
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
      <button
        type="button"
        onClick={startEdit}
        className={`group flex h-full w-full items-center justify-center px-3 py-2 text-sm transition-colors duration-150 ${ACCENT_BG_HOVER[accent] ?? ''}`}
      >
        <span
          className={`font-mono tabular-nums transition-colors ${
            value == null
              ? 'text-slate-300 group-hover:text-slate-400 dark:text-slate-600 dark:group-hover:text-slate-500'
              : 'font-semibold text-slate-800 dark:text-slate-100'
          }`}
        >
          {formatSeconds(value)}
        </span>
      </button>
    );
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center px-1 py-1 ring-2 ring-inset transition-shadow ${ACCENT_RING_FOCUS[accent] ?? 'ring-slate-300/70'}`}
    >
      <TextField
        inputRef={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder="m:ss"
        variant="standard"
        size="small"
        inputProps={{
          // 16px prevents iOS Safari from auto-zooming the viewport on focus.
          inputMode: 'numeric',
          autoComplete: 'off',
          enterKeyHint: 'done',
        }}
        sx={{
          width: '100%',
          '& .MuiInput-input': {
            padding: '2px 4px',
            fontSize: '16px',
            lineHeight: 1.2,
            textAlign: 'center',
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            color: 'inherit',
          },
          '& .MuiInput-underline:before': { borderBottom: 'none' },
          '& .MuiInput-underline:after': { borderBottom: 'none' },
          '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
            borderBottom: 'none',
          },
        }}
      />
    </div>
  );
}

// Compact button that doubles as a display + tap-to-edit field for the mobile cards.
function CompactResultCell({
  userId,
  dateISO,
  value,
  onSave,
}: {
  userId: UserId;
  dateISO: string;
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
      <TextField
        inputRef={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder="m:ss"
        variant="standard"
        size="small"
        autoFocus
        inputProps={{
          inputMode: 'numeric',
          autoComplete: 'off',
          enterKeyHint: 'done',
        }}
        sx={{
          width: '100%',
          '& .MuiInput-input': {
            padding: '2px 4px',
            fontSize: '16px',
            lineHeight: 1.2,
            textAlign: 'center',
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            color: 'inherit',
          },
          '& .MuiInput-underline:before': { borderBottom: 'none' },
          '& .MuiInput-underline:after': { borderBottom: 'none' },
        }}
      />
    );
  }

  // Suppress unused-var warning by referencing userId/dateISO for the key.
  void userId;
  void dateISO;
  return (
    <button
      type="button"
      onClick={startEdit}
      className={`flex h-9 w-full items-center justify-center rounded-lg font-mono text-sm tabular-nums transition-colors ${
        value == null
          ? 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700'
          : `bg-white font-semibold text-slate-800 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700`
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

function ProgressRow({ date, dateISO, isToday, progress, onSetResult }: RowProps) {
  return (
    <tr
      className={`border-b border-slate-100 transition-colors dark:border-slate-800 ${
        isToday
          ? 'bg-amber-50/60 dark:bg-amber-900/20'
          : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
      }`}
    >
      <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5">
        <div className="flex items-baseline gap-2">
          <span
            className={`font-medium ${
              isToday ? 'text-amber-900 dark:text-amber-200' : 'text-slate-800 dark:text-slate-100'
            }`}
          >
            {formatDateDisplay(date)}
          </span>
          <span
            className={`text-xs ${
              isToday ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {formatWeekday(date)}
          </span>
          {isToday && (
            <span className="ml-1 rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900 dark:bg-amber-700 dark:text-amber-100">
              today
            </span>
          )}
        </div>
      </td>

      {USERS.map((user) => {
        const value = getResult(progress, user.id, dateISO);
        return (
          <td key={user.id} className="border-l border-slate-100 p-0 align-middle dark:border-slate-800">
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
}

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
          ? 'border-amber-200 bg-amber-50/60 dark:border-amber-700/60 dark:bg-amber-900/20'
          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
      }`}
    >
      <div className="mb-2 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-sm font-medium ${
              isToday ? 'text-amber-900 dark:text-amber-200' : 'text-slate-800 dark:text-slate-100'
            }`}
          >
            {formatDateDisplay(date)}
          </span>
          <span
            className={`text-xs ${
              isToday ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {formatWeekday(date)}
          </span>
        </div>
        {isToday && (
          <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900 dark:bg-amber-700 dark:text-amber-100">
            today
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {USERS.map((user) => {
          const value = getResult(progress, user.id, dateISO);
          return (
            <div key={user.id} className="flex items-center gap-2">
              <span className={`flex w-16 items-center gap-1.5 text-xs font-medium ${ACCENT_LABEL[user.accent] ?? ''}`}>
                <span className={`inline-block h-2 w-2 rounded-full ${ACCENT_DOT[user.accent] ?? 'bg-slate-400'}`} />
                {user.name}
              </span>
              <CompactResultCell
                userId={user.id}
                dateISO={dateISO}
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

  return (
    <>
      {/* Desktop / tablet: classic table. */}
      <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-700/60 md:block">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur dark:bg-slate-800/95">
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="sticky left-0 z-30 bg-slate-50/95 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/95 dark:text-slate-300">
                  Date
                </th>
                {USERS.map((user) => (
                  <th
                    key={user.id}
                    className="border-l border-slate-200 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-700 dark:border-slate-700 dark:text-slate-200"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${ACCENT_DOT[user.accent] ?? 'bg-slate-400'}`}
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
                return (
                  <ProgressRow
                    key={dateISO}
                    date={date}
                    dateISO={dateISO}
                    isToday={dateISO === today}
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