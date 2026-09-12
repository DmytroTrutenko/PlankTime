export type UserId = 'user1' | 'user2';

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
