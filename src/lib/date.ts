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

const MONTHS_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export interface MonthGroup {
  year: number;
  month: number;
  label: string;
  fullLabel: string;
  dates: Date[];
  isCompleted: boolean;
  isCurrent: boolean;
}

export function groupDatesByMonth(year: number, today: Date = new Date()): MonthGroup[] {
  const all = generateYearDates(year);
  const todayMidnight = new Date(today);
  todayMidnight.setHours(0, 0, 0, 0);

  const groups: MonthGroup[] = [];
  for (const date of all) {
    const month = date.getMonth();
    const last = groups[groups.length - 1];
    if (!last || last.month !== month) {
      const monthEnd = new Date(year, month + 1, 0);
      monthEnd.setHours(0, 0, 0, 0);
      groups.push({
        year,
        month,
        label: MONTHS_LONG[month],
        fullLabel: MONTHS_FULL[month],
        dates: [],
        isCompleted: monthEnd.getTime() < todayMidnight.getTime(),
        isCurrent:
          date.getFullYear() === todayMidnight.getFullYear() &&
          month === todayMidnight.getMonth(),
      });
    }
    // Push into the LAST group (just-created on a month boundary, or the
    // previous group when month is unchanged). Using `last` here would be
    // wrong because `last` is a const captured before the push above.
    groups[groups.length - 1]!.dates.push(date);
  }
  return groups;
}

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