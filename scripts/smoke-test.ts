#!/usr/bin/env node
/* eslint-disable no-console */
// Manual end-to-end smoke test for the Supabase `plank_results` table.
// Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from .env (gitignored),
// then exercises Create, Read, Update, Delete on a single throwaway row,
// plus the unique-constraint rejection.
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
      const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
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
  global: { headers: { 'x-plank-user': 'dima' } },
});

const USER = 'dima';
const DATE = '2099-12-31'; // a date we know won't collide with real entries
const INITIAL = 90;
const UPDATED = 135;

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

async function main(): Promise<void> {
  console.log('-- CLEANUP (pre-run) --');
  await expectOk(
    'delete any leftover row from a previous run',
    supabase.from('plank_results').delete().eq('user_id', USER).eq('date', DATE),
  );

  console.log('-- CREATE --');
  await expectOk(
    'insert row',
    supabase
      .from('plank_results')
      .insert({ user_id: USER, date: DATE, duration_seconds: INITIAL })
      .select('user_id,date,duration_seconds'),
  );

  console.log('-- READ --');
  const afterInsert = await expectOk(
    'read back',
    supabase
      .from('plank_results')
      .select('user_id,date,duration_seconds')
      .eq('user_id', USER)
      .eq('date', DATE),
  );
  const inserted = (afterInsert as Array<{ duration_seconds: number }>)[0];
  if (!inserted || inserted.duration_seconds !== INITIAL) {
    console.error(`[FAIL] read returned wrong value: ${JSON.stringify(afterInsert)}`);
    process.exit(1);
  }
  console.log('[OK]   value matches insert');

  console.log('-- UPDATE --');
  await expectOk(
    'update row',
    supabase
      .from('plank_results')
      .update({ duration_seconds: UPDATED })
      .eq('user_id', USER)
      .eq('date', DATE)
      .select('user_id,date,duration_seconds'),
  );
  const afterUpdate = await expectOk(
    'read back updated',
    supabase
      .from('plank_results')
      .select('duration_seconds')
      .eq('user_id', USER)
      .eq('date', DATE),
  );
  const updated = (afterUpdate as Array<{ duration_seconds: number }>)[0];
  if (!updated || updated.duration_seconds !== UPDATED) {
    console.error(`[FAIL] update did not persist: ${JSON.stringify(afterUpdate)}`);
    process.exit(1);
  }
  console.log('[OK]   updated value persisted');

  console.log('-- UNIQUE CONSTRAINT --');
  await expectErr(
    'duplicate insert for same (user_id, date) rejected',
    supabase
      .from('plank_results')
      .insert({ user_id: USER, date: DATE, duration_seconds: 60 }),
  );

  console.log('-- RLS: cross-user write blocked --');
  // Postgres policies read `request.headers->>'x-plank-user'` and only allow
  // each user to mutate their own rows. We rotate the Postgrest header on
  // the same client (the global headers map), then attempt to mutate user1's
  // row while pretending to be user2. PostgREST returns "success with 0
  // rows affected" when the WHERE clause filters to nothing (which is what
  // an RLS USING-clause denial looks like at the API level). To distinguish
  // "RLS blocked" from "WHERE matched nothing", we read the row back and
  // assert the stored value is unchanged.
  (supabase as unknown as { rest: { headers: Headers } }).rest.headers.set(
    'x-plank-user',
    'anya',
  );
  await supabase
    .from('plank_results')
    .update({ duration_seconds: 200 })
    .eq('user_id', USER)
    .eq('date', DATE);
  (supabase as unknown as { rest: { headers: Headers } }).rest.headers.set(
    'x-plank-user',
    USER,
  );
  const afterCrossUser = await expectOk(
    'read back after cross-user attempt',
    supabase
      .from('plank_results')
      .select('duration_seconds')
      .eq('user_id', USER)
      .eq('date', DATE),
  );
  const stored = (afterCrossUser as Array<{ duration_seconds: number }>)[0];
  if (!stored || stored.duration_seconds !== UPDATED) {
    console.error(
      `[FAIL] cross-user update changed stored value to ${stored?.duration_seconds}; RLS not enforced.`,
    );
    process.exit(1);
  }
  console.log('[OK]   cross-user update was blocked; value still UPDATED');

  console.log('-- DELETE --');
  await expectOk(
    'delete row',
    supabase.from('plank_results').delete().eq('user_id', USER).eq('date', DATE),
  );
  const afterDelete = await expectOk(
    'confirm delete',
    supabase
      .from('plank_results')
      .select('user_id')
      .eq('user_id', USER)
      .eq('date', DATE),
  );
  if ((afterDelete as unknown[]).length !== 0) {
    console.error(`[FAIL] row still present after delete: ${JSON.stringify(afterDelete)}`);
    process.exit(1);
  }
  console.log('[OK]   row gone');

  console.log('\nALL CHECKS PASSED');
}

main().catch((err: unknown) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
