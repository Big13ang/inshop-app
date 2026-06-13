import { loginSchema } from '../constants';

describe('loginSchema — phone validation', () => {
  const valid = (phone: string) => loginSchema.safeParse({ phone }).success;

  const errorFor = (phone: string) => {
    const result = loginSchema.safeParse({ phone });
    if (result.success) return null;
    return result.error.issues[0]?.message ?? null;
  };

  // --- Valid formats (all should pass) ---
  describe('accepts valid Iranian mobile numbers', () => {
    it.each([
      '09171234567',   // standard 09xx format
      '9171234567',    // without leading 0
      '+989171234567', // international format
    ])('accepts %s', (phone) => {
      expect(valid(phone)).toBe(true);
    });
  });

  // --- Invalid formats (all should fail) ---
  describe('rejects invalid inputs', () => {
    it('rejects an empty string', () => {
      expect(valid('')).toBe(false);
    });

    it('rejects a non-numeric string', () => {
      expect(valid('not-a-phone')).toBe(false);
    });

    it('rejects a number too short', () => {
      expect(valid('0917123')).toBe(false);
    });

    it('rejects a foreign number format', () => {
      expect(valid('+14155552671')).toBe(false);
    });

    it('returns a non-empty error message for empty input', () => {
      expect(errorFor('')).not.toBeNull();
      expect(errorFor('')?.length).toBeGreaterThan(0);
    });

    it('returns a non-empty error message for invalid format', () => {
      expect(errorFor('12345')).not.toBeNull();
      expect(errorFor('12345')?.length).toBeGreaterThan(0);
    });
  });
});
