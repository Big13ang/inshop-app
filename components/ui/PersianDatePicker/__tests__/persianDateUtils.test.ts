import {
  isPersianLeapYear,
  getDaysInPersianMonth,
  clampDayToMonth,
  generateDays,
  generateYears,
  toPersianDigits,
  toEnglishDigits,
  parsePersianDate,
  formatPersianDate,
  formatPersianDisplayDate,
  getTodayJalaali,
} from '../persianDateUtils';

describe('persianDateUtils', () => {
  describe('isPersianLeapYear', () => {
    it('accurately identifies known Jalali leap years', () => {
      // 1399, 1403 are leap years (30 days in Esfand)
      expect(isPersianLeapYear(1399)).toBe(true);
      expect(isPersianLeapYear(1403)).toBe(true);
    });

    it('accurately identifies known Jalali non-leap years', () => {
      // 1400, 1401, 1402 are common years (29 days in Esfand)
      expect(isPersianLeapYear(1400)).toBe(false);
      expect(isPersianLeapYear(1401)).toBe(false);
      expect(isPersianLeapYear(1402)).toBe(false);
    });
  });

  describe('getDaysInPersianMonth', () => {
    it('returns 31 days for months 1 to 6', () => {
      for (let m = 1; m <= 6; m++) {
        expect(getDaysInPersianMonth(1403, m)).toBe(31);
      }
    });

    it('returns 30 days for months 7 to 11', () => {
      for (let m = 7; m <= 11; m++) {
        expect(getDaysInPersianMonth(1403, m)).toBe(30);
      }
    });

    it('returns 30 days for Esfand in a leap year', () => {
      expect(getDaysInPersianMonth(1403, 12)).toBe(30);
      expect(getDaysInPersianMonth(1399, 12)).toBe(30);
    });

    it('returns 29 days for Esfand in a regular year', () => {
      expect(getDaysInPersianMonth(1402, 12)).toBe(29);
      expect(getDaysInPersianMonth(1374, 12)).toBe(29);
    });
  });

  describe('clampDayToMonth', () => {
    it('clamps 31 to 30 when switching to month 7', () => {
      expect(clampDayToMonth(1403, 7, 31)).toBe(30);
    });

    it('clamps 31 to 29 when switching to Esfand in a regular year', () => {
      expect(clampDayToMonth(1402, 12, 31)).toBe(29);
    });

    it('keeps valid days unchanged', () => {
      expect(clampDayToMonth(1403, 6, 15)).toBe(15);
      expect(clampDayToMonth(1403, 1, 31)).toBe(31);
    });
  });

  describe('generateDays & generateYears', () => {
    it('generates exact number of days for the month', () => {
      const farvardinDays = generateDays(1403, 1);
      expect(farvardinDays).toHaveLength(31);

      const esfandCommonDays = generateDays(1402, 12);
      expect(esfandCommonDays).toHaveLength(29);
    });

    it('generates configurable years descending', () => {
      const years = generateYears(1400, 1403);
      expect(years).toHaveLength(4);
      expect(years[0].yearNumber).toBe(1403);
      expect(years[3].yearNumber).toBe(1400);
    });
  });

  describe('digit conversions', () => {
    it('converts English digits to Persian digits', () => {
      expect(toPersianDigits('1374/06/15')).toBe('۱۳۷۴/۰۶/۱۵');
      expect(toPersianDigits(1403)).toBe('۱۴۰۳');
    });

    it('converts Persian digits to English digits', () => {
      expect(toEnglishDigits('۱۳۷۴/۰۶/۱۵')).toBe('1374/06/15');
    });
  });

  describe('parsePersianDate & format', () => {
    it('parses valid date string with slashes', () => {
      const parsed = parsePersianDate('1374/06/15');
      expect(parsed.year).toBe(1374);
      expect(parsed.month).toBe(6);
      expect(parsed.day).toBe(15);
      expect(parsed.monthStr).toBe('06');
      expect(parsed.dayStr).toBe('15');
    });

    it('parses date string with Persian digits and dashes', () => {
      const parsed = parsePersianDate('۱۳۸۰-۰۲-۰۸');
      expect(parsed.year).toBe(1380);
      expect(parsed.month).toBe(2);
      expect(parsed.day).toBe(8);
    });

    it('formats date to standard YYYY-MM-DD (hyphen style)', () => {
      expect(formatPersianDate(1374, 6, 5)).toBe('1374-06-05');
    });

    it('formats Persian display date', () => {
      expect(formatPersianDisplayDate('1374/06/15')).toBe('۱۵ شهریور ۱۳۷۴');
    });

    it('returns valid today Jalaali date', () => {
      const today = getTodayJalaali();
      expect(today.jy).toBeGreaterThan(1400);
      expect(today.jm).toBeGreaterThanOrEqual(1);
      expect(today.jm).toBeLessThanOrEqual(12);
      expect(today.jd).toBeGreaterThanOrEqual(1);
      expect(today.jd).toBeLessThanOrEqual(31);
    });
  });
});
