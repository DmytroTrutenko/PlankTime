import { USERS } from '../config/users';
import { formatDateISO } from './date';
import type { Exercise, UserId, YearProgress } from '../types/progress';

export function getResult(
  progress: YearProgress,
  userId: UserId,
  dateISO: string,
  exercise: Exercise,
): number | null {
  return progress.entries[userId][dateISO]?.[exercise] ?? null;
}

export function createEmptyYearProgress(year: number): YearProgress {
  const entries = {} as YearProgress['entries'];
  for (const user of USERS) {
    entries[user.id] = {};
  }
  return { year, entries };
}

// Count every filled input (plank OR push-ups) in the month so the
// "completed entries" pill on each month header still works after we
// merged plank + push-ups into one record-per-day.
export function monthEntryCount(progress: YearProgress, dates: Date[]): number {
  let count = 0;
  for (const user of USERS) {
    const entries = progress.entries[user.id];
    for (const date of dates) {
      const slot = entries[formatDateISO(date)];
      if (!slot) continue;
      if (slot.plank != null) count += 1;
      if (slot.pushups != null) count += 1;
    }
  }
  return count;
}

// Longest run of consecutive days ending today (or yesterday — gives a one-day
// grace so editing at 1am doesn't drop the streak to zero). A "logged" day
// is one where the given exercise has any value — a user can plank but skip
// push-ups and still have a plank streak.
export function currentStreak(
  progress: YearProgress,
  userId: UserId,
  todayISO: string,
  exercise: Exercise,
): number {
  const entries = progress.entries[userId];
  const today = new Date(`${todayISO}T00:00:00`);
  let streak = 0;
  const cursor = new Date(today);

  // Skip today if missing, but only once.
  const todayHas = entries[formatDateISO(cursor)]?.[exercise] != null;
  if (!todayHas) {
    cursor.setDate(cursor.getDate() - 1);
    if (entries[formatDateISO(cursor)]?.[exercise] == null) return 0;
  }

  while (entries[formatDateISO(cursor)]?.[exercise] != null) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}