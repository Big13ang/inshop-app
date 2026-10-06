import { accountSchema, generateDefaultAccountValues, DEFAULT_ACCOUNT_VALUES } from '../accountSchema';
import type { UserMe } from '@/features/profile/services/profileService';

describe('accountSchema validation', () => {
  const baseValidData = {
    firstName: 'محمد',
    lastName: 'رضایی',
    birthDatePersian: '1374-06-15',
    usesWheelchair: false,
    isBlindOrLowVision: false,
    isDeafOrHardOfHearing: false,
  };

  it('validates a complete valid account payload', () => {
    const result = accountSchema.safeParse(baseValidData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe('محمد');
      expect(result.data.lastName).toBe('رضایی');
      expect(result.data.birthDatePersian).toBe('1374-06-15');
      expect(result.data.usesWheelchair).toBe(false);
      expect(result.data.isBlindOrLowVision).toBe(false);
      expect(result.data.isDeafOrHardOfHearing).toBe(false);
    }
  });

  it('normalizes slash and Persian digits date into hyphenated YYYY-MM-DD', () => {
    const result = accountSchema.safeParse({
      ...baseValidData,
      birthDatePersian: '۱۳۷۴/۰۶/۱۵',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.birthDatePersian).toBe('1374-06-15');
    }
  });

  it('succeeds when required firstName and lastName are provided and optional fields are omitted', () => {
    const result = accountSchema.safeParse({
      firstName: 'محمد',
      lastName: 'رضایی',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe('محمد');
      expect(result.data.lastName).toBe('رضایی');
      expect(result.data.birthDatePersian).toBe('');
      expect(result.data.usesWheelchair).toBe(false);
      expect(result.data.isBlindOrLowVision).toBe(false);
      expect(result.data.isDeafOrHardOfHearing).toBe(false);
    }
  });

  it('fails when firstName is empty, whitespace, null, or omitted', () => {
    const emptyResult = accountSchema.safeParse({
      ...baseValidData,
      firstName: '',
    });
    expect(emptyResult.success).toBe(false);
    if (!emptyResult.success) {
      expect(emptyResult.error.issues.find((e) => e.path.includes('firstName'))?.message).toBe('نام الزامی است');
    }

    const whitespaceResult = accountSchema.safeParse({
      ...baseValidData,
      firstName: '   ',
    });
    expect(whitespaceResult.success).toBe(false);
    if (!whitespaceResult.success) {
      expect(whitespaceResult.error.issues.find((e) => e.path.includes('firstName'))?.message).toBe('نام الزامی است');
    }

    const omittedResult = accountSchema.safeParse({
      lastName: 'رضایی',
    });
    expect(omittedResult.success).toBe(false);
    if (!omittedResult.success) {
      expect(omittedResult.error.issues.find((e) => e.path.includes('firstName'))?.message).toBe('نام الزامی است');
    }
  });

  it('fails when lastName is empty, whitespace, null, or omitted', () => {
    const emptyResult = accountSchema.safeParse({
      ...baseValidData,
      lastName: '',
    });
    expect(emptyResult.success).toBe(false);
    if (!emptyResult.success) {
      expect(emptyResult.error.issues.find((e) => e.path.includes('lastName'))?.message).toBe('نام خانوادگی الزامی است');
    }

    const whitespaceResult = accountSchema.safeParse({
      ...baseValidData,
      lastName: '   ',
    });
    expect(whitespaceResult.success).toBe(false);
    if (!whitespaceResult.success) {
      expect(whitespaceResult.error.issues.find((e) => e.path.includes('lastName'))?.message).toBe('نام خانوادگی الزامی است');
    }

    const omittedResult = accountSchema.safeParse({
      firstName: 'محمد',
    });
    expect(omittedResult.success).toBe(false);
    if (!omittedResult.success) {
      expect(omittedResult.error.issues.find((e) => e.path.includes('lastName'))?.message).toBe('نام خانوادگی الزامی است');
    }
  });

  it('fails when firstName exceeds 50 characters', () => {
    const result = accountSchema.safeParse({
      ...baseValidData,
      firstName: 'a'.repeat(51),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMsg = result.error.issues.find((e) => e.path.includes('firstName'))?.message;
      expect(errorMsg).toBe('نام نباید بیشتر از ۵۰ کاراکتر باشد');
    }
  });

  it('fails when lastName exceeds 50 characters', () => {
    const result = accountSchema.safeParse({
      ...baseValidData,
      lastName: 'a'.repeat(51),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMsg = result.error.issues.find((e) => e.path.includes('lastName'))?.message;
      expect(errorMsg).toBe('نام خانوادگی نباید بیشتر از ۵۰ کاراکتر باشد');
    }
  });

  it('fails when birthDatePersian is invalid format', () => {
    const result = accountSchema.safeParse({
      ...baseValidData,
      birthDatePersian: 'invalid-date',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMsg = result.error.issues.find((e) => e.path.includes('birthDatePersian'))?.message;
      expect(errorMsg).toBe('فرمت تاریخ تولد نامعتبر است');
    }
  });
});

describe('generateDefaultAccountValues', () => {
  it('returns DEFAULT_ACCOUNT_VALUES when user is null', () => {
    expect(generateDefaultAccountValues(null)).toEqual(DEFAULT_ACCOUNT_VALUES);
  });

  it('populates fields directly from new UserMe fields when available', () => {
    const user: UserMe = {
      id: 'u-1',
      name: '09035703067',
      email: '09035703067@phone.inshop.local',
      isVerifiedSeller: true,
      sellerActivatedAt: '2026-07-18T17:05:58.322Z',
      isAdmin: false,
      firstName: 'محمد',
      lastName: 'بهشتی',
      description: 'درباره من',
      nationalId: '1234567890',
      birthDatePersian: '1370-05-20',
      usesWheelchair: true,
      isBlindOrLowVision: false,
      isDeafOrHardOfHearing: true,
      profilePicture: null,
      sellerProfile: {
        id: 'sp-1',
        userId: 'u-1',
        username: 'shop',
        shopName: 'Shop',
        phones: [{ id: 'p-1', phoneNumber: '09035703067' }],
      },
    };

    const values = generateDefaultAccountValues(user);
    expect(values).toEqual({
      firstName: 'محمد',
      lastName: 'بهشتی',
      birthDatePersian: '1370-05-20',
      usesWheelchair: true,
      isBlindOrLowVision: false,
      isDeafOrHardOfHearing: true,
    });
  });

  it('falls back to default empty strings when top-level fields are null and name is phone number', () => {
    const user: UserMe = {
      id: 'xsm61u9Bi10HFEqiqKiryqYwLJWQeshl',
      name: '09035703067',
      email: '09035703067@phone.inshop.local',
      isVerifiedSeller: true,
      sellerActivatedAt: '2026-07-18T17:05:58.322Z',
      isAdmin: true,
      firstName: null,
      lastName: null,
      description: null,
      nationalId: null,
      birthDatePersian: null,
      usesWheelchair: false,
      isBlindOrLowVision: false,
      isDeafOrHardOfHearing: false,
      profilePicture: null,
      sellerProfile: null,
    };

    const values = generateDefaultAccountValues(user);
    expect(values).toEqual({
      firstName: '',
      lastName: '',
      birthDatePersian: '',
      usesWheelchair: false,
      isBlindOrLowVision: false,
      isDeafOrHardOfHearing: false,
    });
  });

  it('falls back to user.profile name and lastName when top-level fields are null', () => {
    const user: UserMe = {
      id: 'u-prereg',
      name: '09123456789',
      email: '09123456789@phone.inshop.local',
      isVerifiedSeller: true,
      sellerActivatedAt: '2026-08-01T10:00:00.000Z',
      isAdmin: false,
      firstName: null,
      lastName: null,
      profile: {
        id: 10,
        name: 'علی',
        lastName: 'محمدی',
        phoneNumber: '09123456789',
        nationalIdNumber: '0012345678',
        province: 'تهران',
        city: 'تهران',
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-01T10:00:00.000Z',
      },
      sellerProfile: null,
    };

    const values = generateDefaultAccountValues(user);
    expect(values.firstName).toBe('علی');
    expect(values.lastName).toBe('محمدی');
  });

  it('falls back to user.name when firstName and lastName and profile are null and name is a full person name', () => {
    const user: UserMe = {
      id: 'u-name',
      name: 'سارا احمدی',
      email: 'sara@example.com',
      isVerifiedSeller: false,
      sellerActivatedAt: null,
      isAdmin: false,
      firstName: null,
      lastName: null,
      sellerProfile: null,
    };

    const values = generateDefaultAccountValues(user);
    expect(values.firstName).toBe('سارا');
    expect(values.lastName).toBe('احمدی');
  });
});

