import { passwordSchema } from '../constant';

describe('passwordSchema', () => {
  it('validates valid passwords containing English letters, numbers, and signs', () => {
    expect(passwordSchema.safeParse('Pass1234').success).toBe(true);
    expect(passwordSchema.safeParse('p@ssw0rd!').success).toBe(true);
    expect(passwordSchema.safeParse('1234567a#').success).toBe(true);
  });

  it('rejects passwords containing Persian text', () => {
    const result = passwordSchema.safeParse('Pass1234فارسی');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes('حروف انگلیسی'))).toBe(true);
    }
  });

  it('rejects passwords containing Persian digits', () => {
    const result = passwordSchema.safeParse('Pass۱۲۳۴567');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes('حروف انگلیسی'))).toBe(true);
    }
  });

  it('rejects passwords that are too short or too long', () => {
    expect(passwordSchema.safeParse('P123').success).toBe(false);
    expect(passwordSchema.safeParse('P1234567890123').success).toBe(false);
  });

  it('rejects passwords without English letters or numbers', () => {
    expect(passwordSchema.safeParse('123456789').success).toBe(false);
    expect(passwordSchema.safeParse('abcdefghij').success).toBe(false);
  });
});
