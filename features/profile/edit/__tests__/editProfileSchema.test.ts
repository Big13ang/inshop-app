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

describe('profileSchema address validation', () => {
  const validBaseProfile = {
    shopName: 'فروشگاه تست',
    shopPhoneNumber: '09123456789',
    username: 'valid_user',
    address: 'تهران، خیابان ولیعصر، پلاک ۱۰۰',
    addressShow: true,
    bio: 'توضیحات کوتاه',
  };

  it('fails when address is empty', () => {
    const result = profileSchema.safeParse({
      ...validBaseProfile,
      address: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('آدرس الزامی است');
    }
  });

  it('fails when address is less than 10 characters', () => {
    const result = profileSchema.safeParse({
      ...validBaseProfile,
      address: 'تهران',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('آدرس باید حداقل ۱۰ کاراکتر باشد');
    }
  });

  it('fails when address exceeds 80 characters', () => {
    const result = profileSchema.safeParse({
      ...validBaseProfile,
      address: 'a'.repeat(81),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('آدرس نباید بیشتر از ۸۰ کاراکتر باشد');
    }
  });

  it('passes when address is at least 10 characters', () => {
    const result = profileSchema.safeParse({
      ...validBaseProfile,
      address: 'تهران، خیابان ولیعصر',
    });
    expect(result.success).toBe(true);
  });
});

describe('profileSchema shopPhoneNumber validation', () => {
  const validBaseProfile = {
    shopName: 'فروشگاه تست',
    shopPhoneNumber: '09123456789',
    username: 'valid_user',
    address: 'تهران، خیابان ولیعصر، پلاک ۱۰۰',
    addressShow: true,
    bio: 'توضیحات کوتاه',
  };

  it('fails when shopPhoneNumber contains non-numeric characters', () => {
    const result = profileSchema.safeParse({
      ...validBaseProfile,
      shopPhoneNumber: '0912345678a',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('شماره تلفن باید فقط شامل اعداد باشد');
    }
  });

  it('fails when shopPhoneNumber length is not 11', () => {
    const result = profileSchema.safeParse({
      ...validBaseProfile,
      shopPhoneNumber: '0912345',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('شماره تلفن فروشگاه الزامی است');
    }
  });

  it('passes when shopPhoneNumber contains exactly 11 digits', () => {
    const result = profileSchema.safeParse({
      ...validBaseProfile,
      shopPhoneNumber: '02188888888',
    });
    expect(result.success).toBe(true);
  });
});

describe('profileSchema shopName validation', () => {
  const validBaseProfile = {
    shopName: 'فروشگاه تست',
    shopPhoneNumber: '09123456789',
    username: 'valid_user',
    address: 'تهران، خیابان ولیعصر، پلاک ۱۰۰',
    addressShow: true,
    bio: 'توضیحات کوتاه',
  };

  it('fails when shopName is empty', () => {
    const result = profileSchema.safeParse({
      ...validBaseProfile,
      shopName: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('نام فروشگاه الزامی است');
    }
  });

  it('passes when shopName is provided', () => {
    const result = profileSchema.safeParse({
      ...validBaseProfile,
      shopName: 'نام جدید',
    });
    expect(result.success).toBe(true);
  });
});

describe('profileSchema bio validation', () => {
  const validBaseProfile = {
    shopName: 'فروشگاه تست',
    shopPhoneNumber: '09123456789',
    username: 'valid_user',
    address: 'تهران، خیابان ولیعصر، پلاک ۱۰۰',
    addressShow: true,
  };

  it('passes when bio is omitted (optional)', () => {
    const result = profileSchema.safeParse(validBaseProfile);
    expect(result.success).toBe(true);
  });

  it('passes when bio is empty string', () => {
    const result = profileSchema.safeParse({
      ...validBaseProfile,
      bio: '',
    });
    expect(result.success).toBe(true);
  });

  it('fails when bio exceeds 150 characters', () => {
    const result = profileSchema.safeParse({
      ...validBaseProfile,
      bio: 'a'.repeat(151),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('بایو نباید بیشتر از ۱۵۰ کاراکتر باشد');
    }
  });
});

