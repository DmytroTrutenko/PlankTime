import type { SupabaseClient } from '@supabase/supabase-js';

import { USERS } from '../config/users';
import { supabase } from './supabase';
import type { UserId } from '../types/progress';

export type TrackerTable = 'plank_results' | 'pushups';

export interface TrackerConfig<V extends string> {
  table: TrackerTable;
  valueField: V;
}

// One row as it lives in Postgres: every exercise shares the same identity
// columns and differs only by the measured-value column. We surface those
// four columns in every query and let `valueField` select which one carries
// the actual measurement.
interface BaseRow {
  user_id: string;
  date: string;
}

export type Row<V extends string> = BaseRow & Record<V, number>;

// PostgrestClient exposes `rest.headers` as a `Headers` instance, but the
// supabase-js v2 types mark it `protected`. We cast through `unknown` here
// so the rest of the app can rotate the `x-active-user` header that the
// RLS policies read.
export function postgrestHeaders(c: SupabaseClient = supabase): Headers {
  return (c as unknown as { rest: { headers: Headers } }).rest.headers;
}

export function setActiveUserHeader(userId: UserId): void {
  postgrestHeaders().set('x-active-user', userId);
}

// Writes one day's measurement for one user. Pass `value = null` to delete
// the row, otherwise upsert a (user_id, date) pair with the given value.
// Keeping both branches in one function lets callers stay one-liner short.
export async function setResultForExercise<V extends string>(
  config: TrackerConfig<V>,
  userId: UserId,
  dateISO: string,
  value: number | null,
): Promise<void> {
  setActiveUserHeader(userId);

  if (value == null) {
    const { error } = await supabase
      .from(config.table)
      .delete()
      .eq('user_id', userId)
      .eq('date', dateISO);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from(config.table).upsert(
    {
      user_id: userId,
      date: dateISO,
      [config.valueField]: value,
    } as never,
    { onConflict: 'user_id,date' },
  );
  if (error) throw error;
}

export async function loadYearRows<V extends string>(
  config: TrackerConfig<V>,
  year: number,
): Promise<Row<V>[]> {
  const fromISO = `${year}-01-01`;
  const toISO = `${year + 1}-01-01`;
  // The Database Insert/Update union is disjoint by value column, and
  // supabase-js can't narrow `select(user_id,date,<valueField>)` to a
  // single concrete row type when `valueField` is a generic string. We
  // request a stable projection (the four shared columns plus our generic
  // value column) and shape it at the boundary — safe because the runtime
  // payload is always that shape regardless of `valueField`.
  const { data, error } = await supabase
    .from(config.table)
    .select(`user_id,date,${config.valueField}`)
    .gte('date', fromISO)
    .lt('date', toISO);
  if (error) throw error;
  return (data ?? []) as unknown as Row<V>[];
}

// Whether the given string is one of the two hard-coded user ids. Used to
// narrow `user_id` rows coming back from Postgres before indexing into
// `entries` (which is keyed by `UserId`, not `string`).
export function isKnownUserId(value: string): value is UserId {
  return USERS.some((u) => u.id === value);
}