import { useCallback, useEffect, useState } from 'react';

import { USERS } from '../config/users';
import { getCurrentYear, todayISO } from '../lib/date';
import { createEmptyYearProgress } from '../lib/progress';
import {
  isKnownUserId,
  loadYearRows,
  setResultForExercise,
  type TrackerTable,
} from '../lib/tracker';
import type { Exercise, UserId, YearProgress } from '../types/progress';

export interface UseYearProgress {
  progress: YearProgress;
  loading: boolean;
  error: string | null;
  setResult: (userId: UserId, dateISO: string, exercise: Exercise, value: number | null) => void;
}

// Supabase throws plain `{ message, code, details, ... }` objects on PostgREST
// failures, not `Error` instances — `String(err)` would render `[object Object]`
// and bury the actual reason. Coerce anything with a `message` field first.
function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === 'string' && m.length > 0) return m;
  }
  return String(err);
}

// Mapping from logical exercise to the (table, value column) pair in Postgres.
// One row per (user, date) per table — plank and push-ups live in different
// tables today but get merged into a single per-day record for the UI.
const EXERCISE_CONFIG: Record<
  Exercise,
  { table: TrackerTable; valueField: 'duration_seconds' | 'reps' }
> = {
  plank: { table: 'plank_results', valueField: 'duration_seconds' },
  pushups: { table: 'pushups', valueField: 'reps' },
};

interface RawRow {
  user_id: string;
  date: string;
  duration_seconds?: number;
  reps?: number;
}

function rowsToEntries(
  rows: RawRow[],
  valueField: 'duration_seconds' | 'reps',
): YearProgress['entries'] {
  const entries: YearProgress['entries'] = USERS.reduce(
    (acc, u) => {
      acc[u.id] = {};
      return acc;
    },
    {} as YearProgress['entries'],
  );
  for (const row of rows) {
    if (!isKnownUserId(row.user_id)) continue;
    const userId: UserId = row.user_id;
    const raw = row[valueField];
    if (!Number.isFinite(raw) || raw == null || raw <= 0) continue;
    const slot = entries[userId][row.date] ?? { plank: null, pushups: null };
    if (valueField === 'duration_seconds') {
      slot.plank = raw;
    } else {
      slot.pushups = raw;
    }
    entries[userId][row.date] = slot;
  }
  return entries;
}

function mergeEntries(
  base: YearProgress['entries'],
  overlay: YearProgress['entries'],
): YearProgress['entries'] {
  const merged = {} as YearProgress['entries'];
  for (const user of USERS) {
    merged[user.id] = { ...base[user.id] };
    for (const [date, slot] of Object.entries(overlay[user.id])) {
      const existing = merged[user.id][date] ?? { plank: null, pushups: null };
      merged[user.id][date] = {
        plank: slot.plank ?? existing.plank,
        pushups: slot.pushups ?? existing.pushups,
      };
    }
  }
  return merged;
}

export function useYearProgress(): UseYearProgress {
  const year = getCurrentYear();
  const [progress, setProgress] = useState<YearProgress>(() =>
    createEmptyYearProgress(year),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Load both exercises in parallel and merge into a single per-day record.
    // Re-running the effect on a fresh `year` is fine (the only caller is the
    // hardcoded hook below), but we still pin the dep so React doesn't see a
    // new value every render.
    Promise.all([
      loadYearRows({ table: EXERCISE_CONFIG.plank.table, valueField: 'duration_seconds' }, year),
      loadYearRows({ table: EXERCISE_CONFIG.pushups.table, valueField: 'reps' }, year),
    ])
      .then(([plankRows, pushupRows]) => {
        if (cancelled) return;
        const plankEntries = rowsToEntries(plankRows, 'duration_seconds');
        const pushupEntries = rowsToEntries(pushupRows, 'reps');
        setProgress({
          year,
          entries: mergeEntries(plankEntries, pushupEntries),
        });
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(toMessage(err));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [year]);

  const setResult = useCallback(
    (userId: UserId, dateISO: string, exercise: Exercise, value: number | null) => {
      // Defence in depth: refuse to mutate past dates so a stale UI cannot
      // backfill history. ISO YYYY-MM-DD strings sort chronologically as
      // strings, so direct compare works.
      if (dateISO < todayISO()) return;

      // Optimistic local update first so the UI snaps to the new value.
      setProgress((prev) => {
        const nextUserMap = { ...prev.entries[userId] };
        const slot = nextUserMap[dateISO] ?? { plank: null, pushups: null };
        const nextSlot =
          exercise === 'plank'
            ? { plank: value, pushups: slot.pushups }
            : { plank: slot.plank, pushups: value };
        // Drop the day entirely if both fields are empty so `getResult`
        // reports null correctly and the table doesn't show stale empties.
        if (nextSlot.plank == null && nextSlot.pushups == null) {
          delete nextUserMap[dateISO];
        } else {
          nextUserMap[dateISO] = nextSlot;
        }
        return {
          ...prev,
          entries: { ...prev.entries, [userId]: nextUserMap },
        };
      });

      setResultForExercise(EXERCISE_CONFIG[exercise], userId, dateISO, value).catch(
        async (err: unknown) => {
          setError(toMessage(err));
          // Re-fetch on failure to converge UI with server truth.
          try {
            const [plankRows, pushupRows] = await Promise.all([
              loadYearRows(
                { table: EXERCISE_CONFIG.plank.table, valueField: 'duration_seconds' },
                year,
              ),
              loadYearRows(
                { table: EXERCISE_CONFIG.pushups.table, valueField: 'reps' },
                year,
              ),
            ]);
            const plankEntries = rowsToEntries(plankRows, 'duration_seconds');
            const pushupEntries = rowsToEntries(pushupRows, 'reps');
            setProgress({
              year,
              entries: mergeEntries(plankEntries, pushupEntries),
            });
          } catch {
            // Best-effort recovery; the error is already surfaced.
          }
        },
      );
    },
    [year],
  );

  return { progress, loading, error, setResult };
}