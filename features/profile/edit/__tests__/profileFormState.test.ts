import { PROFILE_FORM_STATE, resolveProfileStateKey } from '../profileFormState';
import type { UserMe } from '../../services/profileService';

describe('profileFormState', () => {
  const baseUser: UserMe = {
    id: 'usr-1',
    name: 'test user',
    email: 'test@example.com',
    isVerifiedSeller: false,
    sellerActivatedAt: null,
    isAdmin: false,
    firstName: null,
    lastName: null,
    description: null,
    nationalId: null,
    birthDatePersian: null,
    usesWheelchair: false,
    isBlindOrLowVision: false,
    isDeafOrHardOfHearing: false,
    profilePicture: null,
    profile: null,
    businessData: null,
    sellerProfile: null,
  };

  it('resolves NEW_USER when user is not a verified seller and has incomplete names', () => {
    const user: UserMe = { ...baseUser, firstName: '', lastName: '' };
    const key = resolveProfileStateKey(user);

    expect(key).toBe('NEW_USER');
    expect(PROFILE_FORM_STATE[key]).toEqual({
      isSeller: false,
      canAccessShopForm: false,
      requiresShopCompletion: false,
      defaultTab: 'userProfile',
    });
  });

  it('resolves COMPLETED_USER when user is not a seller but has first and last names', () => {
    const user: UserMe = {
      ...baseUser,
      firstName: 'علی',
      lastName: 'محمدی',
    };
    const key = resolveProfileStateKey(user);

    expect(key).toBe('COMPLETED_USER');
    expect(PROFILE_FORM_STATE[key]).toEqual({
      isSeller: false,
      canAccessShopForm: false,
      requiresShopCompletion: false,
      defaultTab: 'userProfile',
    });
  });

  it('resolves VERIFIED_SELLER_INCOMPLETE when user is a verified seller without sellerProfile', () => {
    const user: UserMe = {
      ...baseUser,
      isVerifiedSeller: true,
      sellerProfile: null,
    };
    const key = resolveProfileStateKey(user);

    expect(key).toBe('VERIFIED_SELLER_INCOMPLETE');
    expect(PROFILE_FORM_STATE[key]).toEqual({
      isSeller: true,
      canAccessShopForm: true,
      requiresShopCompletion: true,
      defaultTab: 'shopProfile',
    });
  });

  it('resolves VERIFIED_SELLER_COMPLETED when user is a verified seller with completed sellerProfile', () => {
    const user: UserMe = {
      ...baseUser,
      isVerifiedSeller: true,
      sellerProfile: {
        id: 'seller-1',
        userId: 'usr-1',
        username: 'myshop',
        shopName: 'فروشگاه من',
      },
    };
    const key = resolveProfileStateKey(user);

    expect(key).toBe('VERIFIED_SELLER_COMPLETED');
    expect(PROFILE_FORM_STATE[key]).toEqual({
      isSeller: true,
      canAccessShopForm: true,
      requiresShopCompletion: false,
      defaultTab: 'userProfile',
    });
  });
});
