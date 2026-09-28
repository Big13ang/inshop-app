import { accountSchema, generateDefaultAccountValues, DEFAULT_ACCOUNT_VALUES } from '../accountSchema';
import type { UserMe } from '@/features/profile/services/profileService';

describe('accountSchema validation', () => {
  const baseValidData = {
    firstName: 'محمد',
    lastName: 'رضایی',
    nationalId: '1234567890',
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
      expect(result.data.nationalId).toBe('1234567890');
      expect(result.data.birthDatePersian).toBe('1374-06-15');
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

  it('succeeds when optional birthDatePersian is empty string', () => {
    const result = accountSchema.safeParse({
      ...baseValidData,
      birthDatePersian: '',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.birthDatePersian).toBe('');
    }
  });

  it('fails when required nationalId is missing or empty', () => {
    const result = accountSchema.safeParse({
      ...baseValidData,
      nationalId: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMsg = result.error.issues.find((e) => e.path.includes('nationalId'))?.message;
      expect(errorMsg).toBe('کد ملی الزامی است');
    }
  });

  it('fails when required firstName is empty', () => {
    const result = accountSchema.safeParse({
      ...baseValidData,
      firstName: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMsg = result.error.issues.find((e) => e.path.includes('firstName'))?.message;
      expect(errorMsg).toBe('نام الزامی است');
    }
  });

  it('fails when required lastName is empty', () => {
    const result = accountSchema.safeParse({
      ...baseValidData,
      lastName: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errorMsg = result.error.issues.find((e) => e.path.includes('lastName'))?.message;
      expect(errorMsg).toBe('نام خانوادگی الزامی است');
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
      nationalId: '1234567890',
      birthDatePersian: '1370-05-20',
      usesWheelchair: true,
      isBlindOrLowVision: false,
      isDeafOrHardOfHearing: true,
    });
  });

  it('falls back to profile and sellerProfile when top-level fields are null', () => {
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
      profile: {
        id: 1,
        name: 'محم',
        lastName: 'بهشت آئين',
        phoneNumber: '09035703067',
        nationalIdNumber: '2228666611',
        province: 'آذربایجان شرقی',
        city: 'مرند',
        createdAt: '2026-05-27T17:13:06.758Z',
        updatedAt: '2026-05-27T17:13:06.758Z',
      },
      sellerProfile: null,
    };

    const values = generateDefaultAccountValues(user);
    expect(values).toEqual({
      firstName: '',
      lastName: '',
      nationalId: '2228666611',
      birthDatePersian: '',
      usesWheelchair: false,
      isBlindOrLowVision: false,
      isDeafOrHardOfHearing: false,
    });
  });
});
