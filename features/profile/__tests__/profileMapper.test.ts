import {
  applyToUserProfile,
  getHandle,
  getShopName,
  isAddressVisible,
  toFormValues,
  toUpdatePayload,
} from '../utils/profileMapper';
import { text } from '../constants';
import type { UserProfile } from '../services/profileService';

function user(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    name: 'فرشاد',
    email: 'seller@inshop.ir',
    isVerifiedSeller: true,
    sellerActivatedAt: '2026-01-01T00:00:00.000Z',
    isAdmin: false,
    avatarUrl: 'https://cdn.inshop.ir/avatar.jpg',
    profile: {
      id: 1,
      phoneNumber: '09171234567',
      firstName: 'فرشاد',
      lastName: 'تست',
      nationalId: '1234567890',
      status: 'APPROVED',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    businessData: {
      id: 1,
      preRegistrationId: 1,
      shopName: 'گالری طلای مدرن',
      instagramId: 'modern_gold',
      guildId: 'gold',
      address: 'تهران، خیابان پاسداران',
      bio: 'فروش طلا و جواهر',
      showAddress: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    ...overrides,
  };
}

describe('profileMapper', () => {
  describe('getShopName', () => {
    it('returns the shop name', () => {
      expect(getShopName(user())).toBe('گالری طلای مدرن');
    });

    it('falls back when businessData is missing', () => {
      expect(getShopName(user({ businessData: undefined }))).toBe(text.overview.fallbackShopName);
    });
  });

  describe('getHandle', () => {
    it('falls back when the instagram id is null', () => {
      const withoutHandle = user();
      withoutHandle.businessData!.instagramId = null;
      expect(getHandle(withoutHandle)).toBe(text.overview.fallbackHandle);
    });
  });

  describe('isAddressVisible', () => {
    it('is hidden when the address is empty', () => {
      const noAddress = user();
      noAddress.businessData!.address = '';
      expect(isAddressVisible(noAddress)).toBe(false);
    });

    it('is hidden when the seller opted out', () => {
      const optedOut = user();
      optedOut.businessData!.showAddress = false;
      expect(isAddressVisible(optedOut)).toBe(false);
    });

    it('defaults to visible when the backend omits the flag', () => {
      const legacy = user();
      delete legacy.businessData!.showAddress;
      expect(isAddressVisible(legacy)).toBe(true);
    });
  });

  describe('toFormValues', () => {
    it('maps backend fields onto form fields', () => {
      expect(toFormValues(user())).toEqual({
        shopName: 'گالری طلای مدرن',
        handle: 'modern_gold',
        bio: 'فروش طلا و جواهر',
        address: 'تهران، خیابان پاسداران',
        showAddress: true,
        phoneNumber: '09171234567',
        avatar: 'https://cdn.inshop.ir/avatar.jpg',
      });
    });

    it('produces empty defaults for a null user', () => {
      expect(toFormValues(null)).toEqual({
        shopName: '',
        handle: '',
        bio: '',
        address: '',
        showAddress: true,
        phoneNumber: '',
        avatar: '',
      });
    });
  });

  describe('toUpdatePayload', () => {
    it('trims values and nulls an empty handle', () => {
      const payload = toUpdatePayload({
        shopName: '  فروشگاه من  ',
        handle: '  ',
        bio: '  توضیح  ',
        address: '  تهران  ',
        showAddress: false,
        phoneNumber: '  09171234567  ',
        avatar: '',
      });

      expect(payload).toEqual({
        shopName: 'فروشگاه من',
        bio: 'توضیح',
        address: 'تهران',
        addressShow: false,
        phoneNumber: '09171234567',
        avatarUrl: null,
      });
    });
  });

  describe('applyToUserProfile', () => {
    it('merges the payload back into the cached profile', () => {
      const merged = applyToUserProfile(user(), {
        shopName: 'نام جدید',
        bio: 'معرفی جدید',
        address: 'شیراز',
        addressShow: false,
        phoneNumber: '09120000000',
        avatarUrl: 'data:image/png;base64,abc',
      });

      expect(merged.businessData).toMatchObject({
        shopName: 'نام جدید',
        bio: 'معرفی جدید',
        address: 'شیراز',
        showAddress: false,
      });
      expect(merged.sellerProfile).toMatchObject({
        shopName: 'نام جدید',
        bio: 'معرفی جدید',
        address: 'شیراز',
        addressShow: false,
      });
      expect(merged.profile?.phoneNumber).toBe('09120000000');
      expect(merged.avatarUrl).toBe('data:image/png;base64,abc');
    });

    it('leaves unrelated fields untouched', () => {
      const original = user();
      const merged = applyToUserProfile(original, toUpdatePayload(toFormValues(original)));

      expect(merged.id).toBe(original.id);
      expect(merged.isVerifiedSeller).toBe(original.isVerifiedSeller);
      expect(merged.businessData?.guildId).toBe('gold');
    });
  });
});
