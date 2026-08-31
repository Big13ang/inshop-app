import { loginSchema, TEXTS } from '../constants';
import { VALID_PHONE_LIST, INVALID_PHONE_LIST } from './fixtures/phones';

describe('loginSchema — Unit Validation', () => {
  describe('Valid Phone Numbers', () => {
    it.each(VALID_PHONE_LIST)('accepts valid phone format: $label ($phone)', ({ phone }) => {
      const result = loginSchema.safeParse({ phone });
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid Phone Numbers', () => {
    it.each(INVALID_PHONE_LIST)('rejects invalid phone format: $label ($phone)', ({ phone }) => {
      const result = loginSchema.safeParse({ phone });
      expect(result.success).toBe(false);

      if (!result.success) {
        const error = result.error.issues[0]?.message;
        const expectedError =
          phone.length === 0 ? TEXTS.errorRequiredPhone : TEXTS.errorInvalidPhone;
        expect(error).toBe(expectedError);
      }
    });
  });
});
