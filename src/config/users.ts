import type { User, UserId } from '../types/progress';

export const USERS: readonly User[] = [
  { id: 'user1', name: 'User 1', accent: 'sky' },
  { id: 'user2', name: 'User 2', accent: 'rose' },
] as const;

export const USER_IDS: readonly UserId[] = USERS.map((u) => u.id);
