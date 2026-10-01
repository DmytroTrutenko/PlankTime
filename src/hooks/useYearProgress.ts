import { useCallback, useEffect, useState } from 'react';

import { USERS } from '../config/users';
import { getCurrentYear, todayISO } from '../lib/date';
import { createEmptyYearProgress } from '../lib/progress';
import {
  deleteResult,
  isKnownUserId,
  loadYearRows,
  upsertResult,
  type Row,
  type TrackerConfig,
  type TrackerTable,
} from '../lib/tracker';
import type { UserId, YearProgress } from '../types/progress';

export interface UseYearProgress {
  progress: YearProgress;
  loading: boolean;
  error: string | null;
  setResult: (userId: UserId, dateISO: string, value: number | null) => void;
}

// Generic hook shared by every exercise tracker. The caller passes the
// table + value column (`duration_seconds` for plank, `reps` for push-ups);
// keeping a single hook means new trackers only declare their config, they
// don't reimplement load / write / error recovery.
export interface UseYearProgressConfig<V extends string> extends TrackerConfig<V> {
  year: number;
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

function rowsToEntries<V extends string>(rows: Row<V>[], valueField: V): YearProgress['entries'] {
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
    if (!Number.isFinite(raw) || raw <= 0) continue;
    entries[userId][row.date] = raw;
  }
  return entries;
}

export function useYearProgress<V extends string>(
  config: UseYearProgressConfig<V>,
): UseYearProgress {
  // `config` is rebuilt by the caller on every render (object literal), which
  // would make `[config]` a fresh reference every time and re-run the load
  // effect on every state update — an infinite loop on a failing query. Pin
  // the dep to the three primitives that actually matter.
  const { table, valueField, year } = config;

  const [progress, setProgress] = useState<YearProgress>(() =>
    createEmptyYearProgress(year),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadYearRows({ table, valueField }, year)
      .then((rows) => {
        if (cancelled) return;
        setProgress({
          year,
          entries: rowsToEntries(rows, valueField),
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
  }, [table, valueField, year]);

  const setResult = useCallback(
    (userId: UserId, dateISO: string, value: number | null) => {
      // Defence in depth: even if a stale UI slips past the `disabled` prop
      // on ResultCell (e.g. devtools edit, programmatic call), the hook
      // refuses to mutate past dates. The tracker is meant to be a forward-
      // looking log, so backfilling history is a no-op here. ISO YYYY-MM-DD
      // strings sort chronologically as strings, so direct compare works.
      if (dateISO < todayISO()) return;

      // Optimistic local update first so the UI snaps to the new value.
      setProgress((prev) => {
        const nextUserMap = { ...prev.entries[userId] };
        if (value == null) {
          delete nextUserMap[dateISO];
        } else {
          nextUserMap[dateISO] = value;
        }
        return {
          ...prev,
          entries: { ...prev.entries, [userId]: nextUserMap },
        };
      });

      const op =
        value == null
          ? deleteResult({ table, valueField }, userId, dateISO)
          : upsertResult({ table, valueField }, userId, dateISO, value);

      op.catch(async (err: unknown) => {
        setError(toMessage(err));
        // Re-fetch on failure to converge UI with server truth.
        try {
          const rows = await loadYearRows({ table, valueField }, year);
          setProgress({
            year,
            entries: rowsToEntries(rows, valueField),
          });
        } catch {
          // Best-effort recovery; the error is already surfaced.
        }
      });
    },
    [table, valueField, year],
  );

  return { progress, loading, error, setResult };
}

// Convenience wrappers so the call sites stay short and the type signature
// of `useYearPlank` / `useYearPushups` documents the table layout at a
// glance. The year is captured here so the call site doesn't need to know
// about it.
export function useYearPlank() {
  return useYearProgress({
    table: 'plank_results' as TrackerTable,
    valueField: 'duration_seconds',
    year: getCurrentYear(),
  });
}

export function useYearPushups() {
  return useYearProgress({
    table: 'pushups' as TrackerTable,
    valueField: 'reps',
    year: getCurrentYear(),
  });
}
