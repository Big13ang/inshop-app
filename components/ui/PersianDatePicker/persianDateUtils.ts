import { isLeapJalaaliYear, jalaaliMonthLength, toJalaali } from 'jalaali-js';

export interface PersianMonth {
  value: string;
  label: string;
  index: string;
  monthNumber: number;
}

export interface PersianDay {
  value: string;
  label: string;
  rawNumber: string;
  persianNumber: string;
  dayNumber: number;
}

export interface PersianYear {
  value: string;
  label: string;
  persianNumber: string;
  yearNumber: number;
}

export type DatePickerTab = 'day' | 'month' | 'year';

export const PERSIAN_MONTHS: PersianMonth[] = [
  { value: '01', label: 'فروردین', index: '۱', monthNumber: 1 },
  { value: '02', label: 'اردیبهشت', index: '۲', monthNumber: 2 },
  { value: '03', label: 'خرداد', index: '۳', monthNumber: 3 },
  { value: '04', label: 'تیر', index: '۴', monthNumber: 4 },
  { value: '05', label: 'مرداد', index: '۵', monthNumber: 5 },
  { value: '06', label: 'شهریور', index: '۶', monthNumber: 6 },
  { value: '07', label: 'مهر', index: '۷', monthNumber: 7 },
  { value: '08', label: 'آبان', index: '۸', monthNumber: 8 },
  { value: '09', label: 'آذر', index: '۹', monthNumber: 9 },
  { value: '10', label: 'دی', index: '۱۰', monthNumber: 10 },
  { value: '11', label: 'بهمن', index: '۱۱', monthNumber: 11 },
  { value: '12', label: 'اسفند', index: '۱۲', monthNumber: 12 },
];

export function toPersianDigits(str: string | number): string {
  return String(str).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d, 10)]);
}

export function toEnglishDigits(str: string): string {
  return str.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
}

/**
 * Determines whether a given Solar Hijri (Jalali) year is a leap year using jalaali-js.
 */
export function isPersianLeapYear(year: number): boolean {
  return isLeapJalaaliYear(year);
}

/**
 * Returns the exact number of days in a given Persian month and year using jalaali-js.
 */
export function getDaysInPersianMonth(year: number, month: number): number {
  return jalaaliMonthLength(year, month);
}

/**
 * Clamps a day number to the maximum valid days for the given month and year.
 */
export function clampDayToMonth(year: number, month: number, day: number): number {
  const maxDays = jalaaliMonthLength(year, month);
  return Math.min(Math.max(1, day), maxDays);
}

/**
 * Returns today's current Jalaali date { jy, jm, jd }.
 */
export function getTodayJalaali(): { jy: number; jm: number; jd: number } {
  return toJalaali(new Date());
}

/**
 * Generates an array of PersianDay objects for the specified year and month.
 */
export function generateDays(year: number, month: number): PersianDay[] {
  const count = getDaysInPersianMonth(year, month);
  return Array.from({ length: count }, (_, i) => {
    const dayNum = i + 1;
    const val = String(dayNum).padStart(2, '0');
    return {
      value: val,
      label: `روز ${toPersianDigits(dayNum)}`,
      rawNumber: String(dayNum),
      persianNumber: toPersianDigits(dayNum),
      dayNumber: dayNum,
    };
  });
}

/**
 * Generates an array of PersianYear objects between minYear and maxYear in descending order.
 */
export function generateYears(minYear = 1320, maxYear = 1405): PersianYear[] {
  const years: PersianYear[] = [];
  for (let y = maxYear; y >= minYear; y--) {
    years.push({
      value: String(y),
      label: `سال ${toPersianDigits(y)}`,
      persianNumber: toPersianDigits(y),
      yearNumber: y,
    });
  }
  return years;
}

export interface ParsedPersianDate {
  year: number;
  month: number;
  day: number;
  yearStr: string;
  monthStr: string;
  dayStr: string;
}

/**
 * Parses a date string (e.g. "1374/06/15" or "۱۳۷۴-۰۶-۱۵") into structured parts.
 */
export function parsePersianDate(
  dateStr?: string,
  defaults: { year?: number; month?: number; day?: number } = {}
): ParsedPersianDate {
  const fallbackYear = defaults.year ?? 1374;
  const fallbackMonth = defaults.month ?? 6;
  const fallbackDay = defaults.day ?? 15;

  if (!dateStr?.trim()) {
    return {
      year: fallbackYear,
      month: fallbackMonth,
      day: fallbackDay,
      yearStr: String(fallbackYear),
      monthStr: String(fallbackMonth).padStart(2, '0'),
      dayStr: String(fallbackDay).padStart(2, '0'),
    };
  }

  const normalized = toEnglishDigits(dateStr.trim());
  const delimiter = normalized.includes('-') ? '-' : '/';
  const parts = normalized.split(delimiter).map((p) => parseInt(p.trim(), 10));

  const parsedYear = parts[0] && !Number.isNaN(parts[0]) ? parts[0] : fallbackYear;
  let parsedMonth = parts[1] && !Number.isNaN(parts[1]) ? parts[1] : fallbackMonth;
  let parsedDay = parts[2] && !Number.isNaN(parts[2]) ? parts[2] : fallbackDay;

  // Bound checks
  if (parsedMonth < 1) parsedMonth = 1;
  if (parsedMonth > 12) parsedMonth = 12;
  parsedDay = clampDayToMonth(parsedYear, parsedMonth, parsedDay);

  return {
    year: parsedYear,
    month: parsedMonth,
    day: parsedDay,
    yearStr: String(parsedYear),
    monthStr: String(parsedMonth).padStart(2, '0'),
    dayStr: String(parsedDay).padStart(2, '0'),
  };
}

/**
 * Formats structured year, month, and day into "YYYY-MM-DD".
 */
export function formatPersianDate(year: number, month: number, day: number, delimiter = '-'): string {
  const y = String(year);
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}${delimiter}${m}${delimiter}${d}`;
}

/**
 * Formats a date string into a user-facing Persian display format (e.g. "۱۵ شهریور ۱۳۷۴").
 */
export function formatPersianDisplayDate(dateStr?: string): string {
  if (!dateStr?.trim()) return '';
  const parsed = parsePersianDate(dateStr);
  const monthObj = PERSIAN_MONTHS.find((m) => m.monthNumber === parsed.month);
  const monthLabel = monthObj ? monthObj.label : String(parsed.month);
  return `${toPersianDigits(parsed.day)} ${monthLabel} ${toPersianDigits(parsed.year)}`;
}
