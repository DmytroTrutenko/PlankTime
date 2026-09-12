import { USERS } from '../config/users';
import { formatDateISO } from './date';
import type { UserId, YearProgress } from '../types/progress';

export function getResult(
  progress: YearProgress,
  userId: UserId,
  dateISO: string,
): number | null {
  return progress.entries[userId][dateISO] ?? null;
}

export function createEmptyYearProgress(year: number): YearProgress {
  const entries = {} as YearProgress['entries'];
  for (const user of USERS) {
    entries[user.id] = {};
  }
  return { year, entries };
}

export function monthEntryCount(
  progress: YearProgress,
  dates: Date[],
): number {
  let count = 0;
  for (const user of USERS) {
    const entries = progress.entries[user.id];
    for (const date of dates) {
      if (formatDateISO(date) in entries) count += 1;
    }
  }
  return count;
}

// Longest run of consecutive days ending today (or yesterday — gives a one-day
// grace so editing at 1am doesn't drop the streak to zero).
export function currentStreak(
  progress: YearProgress,
  userId: UserId,
  todayISO: string,
): number {
  const entries = progress.entries[userId];
  const today = new Date(`${todayISO}T00:00:00`);
  let streak = 0;
  const cursor = new Date(today);

  // Skip today if missing, but only once.
  if (!(formatDateISO(cursor) in entries)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!(formatDateISO(cursor) in entries)) return 0;
  }

  while (formatDateISO(cursor) in entries) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
