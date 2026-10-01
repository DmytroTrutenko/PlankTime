import { useTheme, type ThemePreference } from '../hooks/useTheme';

const ICON: Record<ThemePreference, string> = {
  light: '☀',
  dark: '☾',
  system: '◐',
};

const LABEL: Record<ThemePreference, string> = {
  light: 'Light theme',
  dark: 'Dark theme',
  system: 'Follow system theme',
};

export function ThemeToggle() {
  const { theme, cycle } = useTheme();

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${LABEL[theme]}. Click to change.`}
      title={LABEL[theme]}
      className="
        inline-flex h-9 w-9 items-center justify-center rounded-full
        border border-stone-300 bg-white text-stone-700 shadow-soft
        transition-colors hover:bg-stone-100 hover:text-ink
        dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200
        dark:hover:bg-stone-800 dark:hover:text-ink-inverse
      "
    >
      <span aria-hidden="true" className="text-base leading-none">
        {ICON[theme]}
      </span>
    </button>
  );
}
