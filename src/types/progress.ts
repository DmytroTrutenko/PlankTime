export type UserId = 'dima' | 'anya';

export interface User {
  id: UserId;
  name: string;
  accent: string;
}

export type ProgressMap = Record<string, number>;

export interface YearProgress {
  year: number;
  entries: Record<UserId, ProgressMap>;
}