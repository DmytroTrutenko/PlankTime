import { useCallback, useEffect, useState } from 'react';

import { KNOWN_USER_IDS, setActiveUserHeader, supabase } from '../lib/supabase';
import { createEmptyYearProgress } from '../lib/progress';
import { getCurrentYear } from '../lib/date';
import type { UserId, YearProgress } from '../types/progress';

interface UseYearProgressResult {
  progress: YearProgress;
  loading: boolean;
  error: string | null;
  setResult: (userId: UserId, dateISO: string, seconds: number | null) => void;
  clearResult: (userId: UserId, dateISO: string) => void;
}

interface PlankRow {
  user_id: string;
  date: string;
  duration_seconds: number;
}

function emptyEntries(): YearProgress['entries'] {
  const entries = {} as YearProgress['entries'];
  for (const id of KNOWN_USER_IDS) {
    entries[id] = {};
  }
  return entries;
}

function rowsToEntries(rows: PlankRow[]): YearProgress['entries'] {
  const entries = emptyEntries();
  for (const row of rows) {
    if (row.user_id !== 'user1' && row.user_id !== 'user2') continue;
    if (!Number.isFinite(row.duration_seconds) || row.duration_seconds <= 0) continue;
    entries[row.user_id][row.date] = row.duration_seconds;
  }
  return entries;
}

function yearDateRange(year: number): { fromISO: string; toISO: string } {
  return {
    fromISO: `${year}-01-01`,
    toISO: `${year + 1}-01-01`,
  };
}

async function loadRowsForYear(year: number): Promise<PlankRow[]> {
  const { fromISO, toISO } = yearDateRange(year);
  const { data, error } = await supabase
    .from('plank_results')
    .select('user_id,date,duration_seconds')
    .gte('date', fromISO)
    .lt('date', toISO);

  if (error) throw error;
  return (data ?? []) as PlankRow[];
}

async function upsertResult(
  userId: UserId,
  dateISO: string,
  seconds: number,
): Promise<void> {
  setActiveUserHeader(userId);
  const { error } = await supabase
    .from('plank_results')
    .upsert(
      { user_id: userId, date: dateISO, duration_seconds: seconds },
      { onConflict: 'user_id,date' },
    );
  if (error) throw error;
}

async function deleteResult(userId: UserId, dateISO: string): Promise<void> {
  setActiveUserHeader(userId);
  const { error } = await supabase
    .from('plank_results')
    .delete()
    .eq('user_id', userId)
    .eq('date', dateISO);
  if (error) throw error;
}

export function useYearProgress(): UseYearProgressResult {
  const year = getCurrentYear();
  const [progress, setProgress] = useState<YearProgress>(() =>
    createEmptyYearProgress(year),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadRowsForYear(year)
      .then((rows) => {
        if (cancelled) return;
        setProgress({ year, entries: rowsToEntries(rows) });
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [year]);

  const setResult = useCallback(
    (userId: UserId, dateISO: string, seconds: number | null) => {
      setProgress((prev) => {
        const nextUserMap = { ...prev.entries[userId] };
        if (seconds == null) {
          delete nextUserMap[dateISO];
        } else {
          nextUserMap[dateISO] = seconds;
        }
        return {
          ...prev,
          entries: { ...prev.entries, [userId]: nextUserMap },
        };
      });

      const op = seconds == null
        ? deleteResult(userId, dateISO)
        : upsertResult(userId, dateISO, seconds);

      op.catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
        void loadRowsForYear(year).then((rows) => {
          setProgress({ year, entries: rowsToEntries(rows) });
        });
      });
    },
    [year],
  );

  const clearResult = useCallback(
    (userId: UserId, dateISO: string) => {
      setResult(userId, dateISO, null);
    },
    [setResult],
  );

  return { progress, loading, error, setResult, clearResult };
}
