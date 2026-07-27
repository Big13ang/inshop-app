import { profileFormSchema, type ProfileFormValues } from '../schemas/profileSchema';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import { PROFILE_LIMITS } from '../constants';

function values(overrides: Partial<ProfileFormValues> = {}): ProfileFormValues {
  return {
    shopName: 'گالری طلای مدرن',
    username: 'modern_gold',
    bio: 'فروش انواع طلا و جواهر',
    address: 'تهران، خیابان پاسداران',
    showAddress: true,
    phoneNumber: '09171234567',
    profilePhotoUrl: '',
    ...overrides,
  };
}

function firstErrorFor(input: ProfileFormValues, field: keyof ProfileFormValues): string | undefined {
  const result = profileFormSchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe('profileFormSchema', () => {
  it('accepts a fully valid profile', () => {
    expect(profileFormSchema.safeParse(values()).success).toBe(true);
  });

  describe('shopName', () => {
    it('rejects an empty name with the required message', () => {
      expect(firstErrorFor(values({ shopName: '   ' }), 'shopName')).toBe(
        ERROR_MESSAGES.profile.shopNameRequired,
      );
    });

    it('rejects a name shorter than the minimum', () => {
      expect(firstErrorFor(values({ shopName: 'اب' }), 'shopName')).toBe(
        ERROR_MESSAGES.profile.shopNameTooShort(PROFILE_LIMITS.shopName.min),
      );
    });

    it('rejects a name longer than the maximum', () => {
      expect(firstErrorFor(values({ shopName: 'ا'.repeat(61) }), 'shopName')).toBe(
        ERROR_MESSAGES.profile.shopNameTooLong(PROFILE_LIMITS.shopName.max),
      );
    });
  });

  describe('username', () => {
    it('allows an empty username because it is optional', () => {
      expect(firstErrorFor(values({ username: '' }), 'username')).toBeUndefined();
    });

    it('rejects non-latin characters', () => {
      expect(firstErrorFor(values({ username: 'فروشگاه' }), 'username')).toBe(
        ERROR_MESSAGES.profile.handleInvalid,
      );
    });

    it('rejects a username shorter than the minimum', () => {
      expect(firstErrorFor(values({ username: 'ab' }), 'username')).toBe(
        ERROR_MESSAGES.profile.handleTooShort(PROFILE_LIMITS.handle.min),
      );
    });
  });

  describe('bio', () => {
    it('rejects a bio over the character limit', () => {
      expect(firstErrorFor(values({ bio: 'ا'.repeat(251) }), 'bio')).toBe(
        ERROR_MESSAGES.profile.bioTooLong(PROFILE_LIMITS.bio.max),
      );
    });
  });

  describe('address visibility', () => {
    it('requires an address when the seller chose to display it', () => {
      expect(firstErrorFor(values({ address: '', showAddress: true }), 'address')).toBe(
        ERROR_MESSAGES.profile.addressRequiredWhenVisible,
      );
    });

    it('allows an empty address when display is turned off', () => {
      expect(profileFormSchema.safeParse(values({ address: '', showAddress: false })).success).toBe(
        true,
      );
    });
  });

  describe('phoneNumber', () => {
    it('rejects an empty phone number', () => {
      expect(firstErrorFor(values({ phoneNumber: '' }), 'phoneNumber')).toBe(
        ERROR_MESSAGES.profile.phoneRequired,
      );
    });

    it.each(['0917123456', '99171234567', '+989171234567', 'abcdefghijk'])(
      'rejects the malformed number %s',
      (phoneNumber) => {
        expect(firstErrorFor(values({ phoneNumber }), 'phoneNumber')).toBe(
          ERROR_MESSAGES.profile.phoneInvalid,
        );
      },
    );
  });
});
