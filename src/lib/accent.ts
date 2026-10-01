// Tailwind class fragments keyed by user accent. Centralised here so the
// table cells, summary cards, and any future surface stay colour-consistent
// without each component redefining its own sky/rose maps.
//
// The accent strings come from `config/users.ts` and must stay in sync
// with the keys below.

export type Accent = 'sky' | 'rose';

export const ACCENT_BG_HOVER: Record<Accent, string> = {
  sky: 'hover:bg-sky-50 focus-within:bg-sky-50 dark:hover:bg-sky-950/40 dark:focus-within:bg-sky-950/50',
  rose: 'hover:bg-rose-50 focus-within:bg-rose-50 dark:hover:bg-rose-950/40 dark:focus-within:bg-rose-950/50',
};

export const ACCENT_DOT: Record<Accent, string> = {
  sky: 'bg-sky-500',
  rose: 'bg-rose-500',
};

export const ACCENT_LABEL: Record<Accent, string> = {
  sky: 'text-sky-700 dark:text-sky-300',
  rose: 'text-rose-700 dark:text-rose-300',
};

export const ACCENT_RING: Record<Accent, string> = {
  sky: 'ring-sky-200/70 dark:ring-sky-900/50',
  rose: 'ring-rose-200/70 dark:ring-rose-900/50',
};

export const ACCENT_STREAK_BG: Record<Accent, string> = {
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
};

export const ACCENT_STREAK_BG_ACTIVE: Record<Accent, string> = {
  sky: 'bg-sky-500 text-white dark:bg-sky-500 dark:text-white',
  rose: 'bg-rose-500 text-white dark:bg-rose-500 dark:text-white',
};

// Safe fallbacks for accent strings outside the known set.
export const FALLBACK_DOT = 'bg-stone-400';
export const FALLBACK_RING = 'ring-stone-200/70 dark:ring-stone-800/60';
export const FALLBACK_STREAK_BG =
  'bg-stone-100 text-stone-500 dark:bg-stone-900 dark:text-stone-400';
export const FALLBACK_STREAK_BG_ACTIVE = 'bg-stone-800 text-white';
