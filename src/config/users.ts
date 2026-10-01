import type { Accent } from '../lib/accent';
import type { User, UserId } from '../types/progress';

export const USERS: readonly User[] = [
  { id: 'dima', name: 'Dima', accent: 'sky' satisfies Accent },
  { id: 'anya', name: 'Anya', accent: 'rose' satisfies Accent },
] as const;

export const USER_IDS: readonly UserId[] = USERS.map((u) => u.id);
