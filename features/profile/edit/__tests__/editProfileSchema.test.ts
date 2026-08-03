import { profileSchema } from '../editProfileSchema';

describe('profileSchema username validation', () => {
  const validBaseProfile = {
    shopName: 'فروشگاه تست',
    shopPhoneNumber: '09123456789',
    username: 'valid_user',
    address: 'تهران، خیابان ولیعصر، پلاک ۱۰۰',
    addressShow: true,
    bio: 'توضیحات کوتاه',
  };

  it('fails when username is empty', () => {
    const result = profileSchema.safeParse({
      ...validBaseProfile,
      username: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('نام کاربری الزامی است');
    }
  });

  it('fails when username is less than 3 characters', () => {
    const result = profileSchema.safeParse({
      ...validBaseProfile,
      username: 'ab',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('نام کاربری باید حداقل ۳ کاراکتر باشد');
    }
  });

  it('passes when username is valid', () => {
    const result = profileSchema.safeParse({
      ...validBaseProfile,
      username: 'valid.user_123',
    });
    expect(result.success).toBe(true);
  });
});
