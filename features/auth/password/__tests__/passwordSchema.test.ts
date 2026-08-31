import { passwordSchema } from '../../constant';
import { VALID_PASSWORD_LIST, INVALID_PASSWORD_LIST } from './fixtures/passwords';

describe('passwordSchema — Unit Validation', () => {
  describe('Valid Passwords', () => {
    it.each(VALID_PASSWORD_LIST)('accepts valid password format: $label ($password)', ({ password }) => {
      const result = passwordSchema.safeParse(password);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid Passwords', () => {
    it.each(INVALID_PASSWORD_LIST)('rejects invalid password format: $label ($password)', ({ password }) => {
      const result = passwordSchema.safeParse(password);
      expect(result.success).toBe(false);
    });
  });
});
