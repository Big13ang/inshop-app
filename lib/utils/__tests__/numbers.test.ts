import { convertPersianArabicToEnglish } from '../numbers';

describe('convertPersianArabicToEnglish', () => {
  it.each([
    { label: 'Persian digits', input: '۰۹۱۷۱۲۳۴۵۶۷', expected: '09171234567' },
    { label: 'Arabic digits', input: '٠٩١٧١٢٣٤٥٦٧', expected: '09171234567' },
    { label: 'English digits', input: '1234567890', expected: '1234567890' },
    { label: 'mixed digits and characters', input: 'abc۰۹۱۲xyz٠٩١٢', expected: 'abc0912xyz0912' },
    { label: 'empty string', input: '', expected: '' },
  ])('$label: converts "$input" to "$expected"', ({ input, expected }) => {
    expect(convertPersianArabicToEnglish(input)).toBe(expected);
  });
});
