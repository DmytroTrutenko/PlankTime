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
  sky: 'hover:bg-sky-50/70 focus-within:bg-sky-50',
  rose: 'hover:bg-rose-50/70 focus-within:bg-rose-50',
};

const ACCENT_RING_FOCUS: Record<string, string> = {
  sky: 'focus-within:ring-sky-300',
  rose: 'focus-within:ring-rose-300',
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
        className={`group flex h-full w-full items-center justify-center px-3 py-2 text-sm transition-colors ${ACCENT_BG_HOVER[accent] ?? ''}`}
      >
        <span
          className={`font-mono tabular-nums ${
            value == null ? 'text-slate-300' : 'font-semibold text-slate-800'
          }`}
        >
          {formatSeconds(value)}
        </span>
      </button>
    );
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center px-1.5 py-1 ring-2 ring-inset ${ACCENT_RING_FOCUS[accent] ?? 'focus-within:ring-slate-300'}`}
    >
      <TextField
        inputRef={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder="м:сс"
        variant="standard"
        size="small"
        sx={{
          width: '100%',
          '& .MuiInput-input': {
            padding: '2px 4px',
            fontSize: '0.875rem',
            textAlign: 'center',
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
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
      className={`border-b border-slate-100 transition-colors ${
        isToday ? 'bg-amber-50/60' : 'hover:bg-slate-50/60'
      }`}
    >
      <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5">
        <div className="flex items-baseline gap-2">
          <span
            className={`font-medium ${
              isToday ? 'text-amber-900' : 'text-slate-800'
            }`}
          >
            {formatDateDisplay(date)}
          </span>
          <span
            className={`text-xs ${
              isToday ? 'text-amber-700' : 'text-slate-400'
            }`}
          >
            {formatWeekday(date)}
          </span>
          {isToday && (
            <span className="ml-1 rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900">
              сегодня
            </span>
          )}
        </div>
      </td>

      {USERS.map((user) => {
        const value = getResult(progress, user.id, dateISO);
        return (
          <td key={user.id} className="border-l border-slate-100 p-0 align-middle">
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

export function ProgressTable({ progress, onSetResult }: ProgressTableProps) {
  const dates = generateYearDates(progress.year);
  const today = todayISO();

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur">
            <tr className="border-b border-slate-200">
              <th className="sticky left-0 z-30 bg-slate-50/95 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Дата
              </th>
              {USERS.map((user) => (
                <th
                  key={user.id}
                  className="border-l border-slate-200 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        user.accent === 'sky' ? 'bg-sky-500' : 'bg-rose-500'
                      }`}
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
  );
}
