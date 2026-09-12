import { createClient } from '@supabase/supabase-js';

import type { Database } from '../types/database';
import type { UserId } from '../types/progress';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in the values.',
  );
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: { persistSession: false },
});

// PostgrestClient exposes `rest.headers` as a `Headers` instance, but the v2
// types mark it `protected`. We cast through `unknown` to rotate the
// `x-plank-user` header that the RLS policies read.
function postgrestHeaders(): Headers {
  return (supabase as unknown as { rest: { headers: Headers } }).rest.headers;
}

export function setActiveUserHeader(userId: UserId): void {
  postgrestHeaders().set('x-plank-user', userId);
}

export const KNOWN_USER_IDS: readonly UserId[] = ['dima', 'anya'];

export function isKnownUserId(value: string): value is UserId {
  return value === 'dima' || value === 'anya';
}