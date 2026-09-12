import type { User, UserId } from '../types/progress';

export const USERS: readonly User[] = [
  { id: 'dima', name: 'Dima', accent: 'sky' },
  { id: 'anya', name: 'Anya', accent: 'rose' },
] as const;

export const USER_IDS: readonly UserId[] = USERS.map((u) => u.id);