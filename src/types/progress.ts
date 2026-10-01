import type { Accent } from '../lib/accent';

export type UserId = 'dima' | 'anya';

export type Exercise = 'plank' | 'pushups';

export interface User {
  id: UserId;
  name: string;
  accent: Accent;
}

// One day holds two independent measurements — the time held in plank and the
// number of push-up reps. Both are optional: a user may plank but skip
// push-ups (or vice versa). Co-locating them per day matches the UI: one
// row per user per day, two inputs side-by-side.
export interface DayResult {
  plank: number | null;
  pushups: number | null;
}

export type DayResultMap = Record<string, DayResult>;

export interface YearProgress {
  year: number;
  entries: Record<UserId, DayResultMap>;
}