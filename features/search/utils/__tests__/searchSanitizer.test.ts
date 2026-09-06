import {
  normalizeSearchQuery,
  sanitizeSearchQuery,
  cleanSearchQuery,
} from '../searchSanitizer';

describe('searchSanitizer', () => {
  describe('normalizeSearchQuery', () => {
    it('normalizes Arabic Yeh to Persian Yeh', () => {
      // Arabic Yeh (\u064A) and Alef Maksura (\u0649)
      expect(normalizeSearchQuery('علي موسي')).toBe('علی موسی');
    });

    it('normalizes Arabic Kaf to Persian Kaf', () => {
      // Arabic Kaf (\u0643)
      expect(normalizeSearchQuery('كتاب')).toBe('کتاب');
    });

    it('converts Persian and Arabic digits to ASCII digits', () => {
      expect(normalizeSearchQuery('کفش ۱۲۳')).toBe('کفش 123');
      expect(normalizeSearchQuery('ساعت ٤٥٦')).toBe('ساعت 456');
    });

    it('collapses multiple whitespace characters and trims', () => {
      expect(normalizeSearchQuery('   کیف    چرمی   ')).toBe('کیف چرمی');
    });

    it('handles empty or blank string gracefully', () => {
      expect(normalizeSearchQuery('')).toBe('');
      expect(normalizeSearchQuery('   ')).toBe('');
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('strips HTML tags and brackets', () => {
      expect(sanitizeSearchQuery('<script>alert("xss")</script>کفش')).toBe('alert("xss")کفش');
      expect(sanitizeSearchQuery('<div>تیشرت</div>')).toBe('تیشرت');
      expect(sanitizeSearchQuery('<>شلوار<>')).toBe('شلوار');
    });

    it('strips non-printable ASCII control characters', () => {
      expect(sanitizeSearchQuery('کفش\x00\x1Fاسپرت')).toBe('کفشاسپرت');
    });

    it('handles empty input', () => {
      expect(sanitizeSearchQuery('')).toBe('');
    });
  });

  describe('cleanSearchQuery', () => {
    it('runs both sanitization and normalization', () => {
      expect(cleanSearchQuery('  <b>كتاب ۱۲</b>  ')).toBe('کتاب 12');
    });
  });
});
