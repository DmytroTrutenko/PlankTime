const MONTHS_LONG = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function generateYearDates(year: number): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(year, 0, 1);
  cursor.setHours(0, 0, 0, 0);

  while (cursor.getFullYear() === year) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return formatDateISO(new Date());
}

export function formatDateDisplay(date: Date): string {
  return `${MONTHS_LONG[date.getMonth()]} ${date.getDate()}`;
}

export function formatWeekday(date: Date): string {
  return WEEKDAYS_SHORT[date.getDay()];
}

export function formatSeconds(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || totalSeconds <= 0) return '—';

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const TIME_INPUT_PATTERN = /^\d{1,2}(:\d{1,2}){0,2}$/;

export function parseTimeInput(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === '') return null;

  if (!TIME_INPUT_PATTERN.test(trimmed)) return null;

  const parts = trimmed.split(':').map((p) => Number.parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n) || n < 0)) return null;

  if (parts.length === 1) {
    return parts[0]!;
  }
  if (parts.length === 2) {
    return parts[0]! * 60 + parts[1]!;
  }
  return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
}