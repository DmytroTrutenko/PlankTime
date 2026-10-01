#!/usr/bin/env node
/* eslint-disable no-console */
// Manual end-to-end smoke test for the Supabase `plank_results` and `pushups`
// tables. Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from .env (gitignored),
// then exercises Create, Read, Update, Delete on a single throwaway row in each
// table, plus the unique-constraint rejection.
//
// Run with:  npm run smoke-test

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadDotenv(): void {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed
        .slice(eq + 1)
        .trim()
        .replace(/^['"]|['"]$/g, '');
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // .env is optional here; CI may pass env vars directly.
  }
}

loadDotenv();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Set them in .env or pass via env.',
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false },
  global: { headers: { 'x-active-user': 'dima' } },
});

function postgrestHeaders(): Headers {
  return (supabase as unknown as { rest: { headers: Headers } }).rest.headers;
}

async function expectOk<T>(
  label: string,
  promise: Promise<{ data: T; error: { message: string } | null }>,
): Promise<T> {
  const { data, error } = await promise;
  if (error) {
    console.error(`[FAIL] ${label}: ${error.message}`);
    process.exit(1);
  }
  console.log(`[OK]   ${label}`);
  return data;
}

async function expectErr(
  label: string,
  promise: Promise<{ data: unknown; error: { message: string } | null }>,
): Promise<void> {
  const { error } = await promise;
  if (!error) {
    console.error(`[FAIL] ${label}: expected an error but got success`);
    process.exit(1);
  }
  console.log(`[OK]   ${label}: ${error.message}`);
}

interface TableSpec<F extends string> {
  name: string;
  table: 'plank_results' | 'pushups';
  field: F;
  initial: number;
  updated: number;
}

// One spec per tracker. Same shape, different table / value field.
const SPECS: ReadonlyArray<TableSpec<'duration_seconds' | 'reps'>> = [
  {
    name: 'plank_results',
    table: 'plank_results',
    field: 'duration_seconds',
    initial: 90,
    updated: 135,
  },
  {
    name: 'pushups',
    table: 'pushups',
    field: 'reps',
    initial: 25,
    updated: 30,
  },
];

const USER = 'dima';
// Two distinct throwaway dates so the two specs don't collide on
// the unique (user_id, date) constraint.
const DATES: Record<string, string> = {
  plank_results: '2099-12-31',
  pushups: '2099-12-30',
};

async function runSpec(spec: TableSpec<'duration_seconds' | 'reps'>): Promise<void> {
  const date = DATES[spec.name]!;
  const insert = { user_id: USER, date, [spec.field]: spec.initial };
  const update = { [spec.field]: spec.updated };
  const insertDup = { user_id: USER, date, [spec.field]: 60 };

  console.log(`\n-- ${spec.name.toUpperCase()} --`);

  console.log('-- CLEANUP (pre-run) --');
  await expectOk(
    'delete any leftover row from a previous run',
    supabase.from(spec.table).delete().eq('user_id', USER).eq('date', date),
  );

  console.log('-- CREATE --');
  await expectOk(
    'insert row',
    supabase
      .from(spec.table)
      .insert(insert)
      .select('user_id,date,' + spec.field),
  );

  console.log('-- READ --');
  const afterInsert = await expectOk(
    'read back',
    supabase
      .from(spec.table)
      .select('user_id,date,' + spec.field)
      .eq('user_id', USER)
      .eq('date', date),
  );
  const inserted = (afterInsert as Array<Record<string, unknown>>)[0];
  if (!inserted || inserted[spec.field] !== spec.initial) {
    console.error(`[FAIL] read returned wrong value: ${JSON.stringify(afterInsert)}`);
    process.exit(1);
  }
  console.log('[OK]   value matches insert');

  console.log('-- UPDATE --');
  await expectOk(
    'update row',
    supabase
      .from(spec.table)
      .update(update)
      .eq('user_id', USER)
      .eq('date', date)
      .select('user_id,date,' + spec.field),
  );
  const afterUpdate = await expectOk(
    'read back updated',
    supabase.from(spec.table).select(spec.field).eq('user_id', USER).eq('date', date),
  );
  const updated = (afterUpdate as Array<Record<string, unknown>>)[0];
  if (!updated || updated[spec.field] !== spec.updated) {
    console.error(`[FAIL] update did not persist: ${JSON.stringify(afterUpdate)}`);
    process.exit(1);
  }
  console.log('[OK]   updated value persisted');

  console.log('-- UNIQUE CONSTRAINT --');
  await expectErr(
    'duplicate insert for same (user_id, date) rejected',
    supabase.from(spec.table).insert(insertDup),
  );

  console.log('-- RLS: cross-user write blocked --');
  // Postgres policies read `request.headers->>'x-active-user'` and only
  // allow each user to mutate their own rows. We rotate the Postgrest
  // header on the same client (the global headers map), then attempt to
  // mutate user1's row while pretending to be user2. PostgREST returns
  // "success with 0 rows affected" when the WHERE clause filters to
  // nothing (which is what an RLS USING-clause denial looks like at the
  // API level). To distinguish "RLS blocked" from "WHERE matched
  // nothing", we read the row back and assert the stored value is
  // unchanged.
  postgrestHeaders().set('x-active-user', 'anya');
  await supabase
    .from(spec.table)
    .update({ [spec.field]: 200 })
    .eq('user_id', USER)
    .eq('date', date);
  postgrestHeaders().set('x-active-user', USER);
  const afterCrossUser = await expectOk(
    'read back after cross-user attempt',
    supabase.from(spec.table).select(spec.field).eq('user_id', USER).eq('date', date),
  );
  const stored = (afterCrossUser as Array<Record<string, unknown>>)[0];
  if (!stored || stored[spec.field] !== spec.updated) {
    console.error(
      `[FAIL] cross-user update changed stored value to ${stored?.[spec.field]}; RLS not enforced.`,
    );
    process.exit(1);
  }
  console.log('[OK]   cross-user update was blocked; value still UPDATED');

  console.log('-- DELETE --');
  await expectOk(
    'delete row',
    supabase.from(spec.table).delete().eq('user_id', USER).eq('date', date),
  );
  const afterDelete = await expectOk(
    'confirm delete',
    supabase.from(spec.table).select('user_id').eq('user_id', USER).eq('date', date),
  );
  if ((afterDelete as unknown[]).length !== 0) {
    console.error(`[FAIL] row still present after delete: ${JSON.stringify(afterDelete)}`);
    process.exit(1);
  }
  console.log('[OK]   row gone');
}

async function main(): Promise<void> {
  for (const spec of SPECS) {
    await runSpec(spec);
  }
  console.log('\nALL CHECKS PASSED');
}

main().catch((err: unknown) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
