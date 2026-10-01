import type { Accent } from '../lib/accent';

export type UserId = 'dima' | 'anya';

export interface User {
  id: UserId;
  name: string;
  accent: Accent;
}

export type ProgressMap = Record<string, number>;

export interface YearProgress {
  year: number;
  entries: Record<UserId, ProgressMap>;
}
