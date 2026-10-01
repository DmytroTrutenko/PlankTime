import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'plank-theme';
const VALID: readonly ThemePreference[] = ['light', 'dark', 'system'];

function readStored(): ThemePreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && (VALID as readonly string[]).includes(raw)) return raw as ThemePreference;
  } catch {
    // localStorage may be unavailable (private mode, etc.) — fall through.
  }
  return 'system';
}

function applyTheme(pref: ThemePreference): void {
  const root = document.documentElement;
  const wantsDark =
    pref === 'dark' ||
    (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  root.classList.toggle('dark', wantsDark);
  root.dataset.theme = pref;
}

export function useTheme(): {
  theme: ThemePreference;
  setTheme: (next: ThemePreference) => void;
  cycle: () => void;
} {
  const [theme, setThemeState] = useState<ThemePreference>(readStored);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((next: ThemePreference) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage failures — theme still works for this session.
    }
    setThemeState(next);
  }, []);

  const cycle = useCallback(() => {
    setThemeState((prev) => {
      const order: ThemePreference[] = ['light', 'dark', 'system'];
      const next = order[(order.indexOf(prev) + 1) % order.length]!;
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Ignore.
      }
      applyTheme(next);
      return next;
    });
  }, []);

  return { theme, setTheme, cycle };
}
