import { normalizePostDescription } from '../formatDescription';

describe('normalizePostDescription', () => {
  it('returns empty string for null, undefined, or empty string', () => {
    expect(normalizePostDescription(null)).toBe('');
    expect(normalizePostDescription(undefined)).toBe('');
    expect(normalizePostDescription('')).toBe('');
  });

  it('preserves standard newline (\\n) enters', () => {
    const input = 'خط اول\nخط دوم\nخط سوم';
    expect(normalizePostDescription(input)).toBe('خط اول\nخط دوم\nخط سوم');
  });

  it('normalizes Windows CRLF (\\r\\n) and classic CR (\\r) to LF (\\n)', () => {
    const input = 'خط اول\r\nخط دوم\rخط سوم';
    expect(normalizePostDescription(input)).toBe('خط اول\nخط دوم\nخط سوم');
  });

  it('unescapes literal \\\\n and \\\\r\\\\n escape sequences', () => {
    const input = 'خط اول\\nخط دوم\\r\\nخط سوم';
    expect(normalizePostDescription(input)).toBe('خط اول\nخط دوم\nخط سوم');
  });

  it('preserves multiple consecutive newlines (paragraph breaks)', () => {
    const input = 'تیتر\n\nتوضیحات پاراگراف اول\n\nتوضیحات پاراگراف دوم';
    expect(normalizePostDescription(input)).toBe('تیتر\n\nتوضیحات پاراگراف اول\n\nتوضیحات پاراگراف دوم');
  });

  it('trims leading and trailing whitespace while retaining internal line breaks', () => {
    const input = '   \n\n  متن اصلی با اینتر\nخط بعدی  \n   ';
    expect(normalizePostDescription(input)).toBe('متن اصلی با اینتر\nخط بعدی');
  });
});
