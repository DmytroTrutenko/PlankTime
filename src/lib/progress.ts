import { USERS } from '../config/users';
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
