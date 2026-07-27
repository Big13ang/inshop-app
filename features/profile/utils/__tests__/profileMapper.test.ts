import { mapUserProfileToFormValues } from '../profileMapper';
import type { UserProfile } from '../../services/profileService';

describe('mapUserProfileToFormValues', () => {
  it('returns empty default values when user is undefined or null', () => {
    const values = mapUserProfileToFormValues(undefined);
    expect(values).toEqual({
      shopName: '',
      username: '',
      bio: '',
      address: '',
      showAddress: true,
      phoneNumber: '',
      profilePhotoUrl: '',
    });
  });

  it('maps fields from sellerProfile when present', () => {
    const user: UserProfile = {
      id: 'u1',
      name: 'Farshad',
      email: 'test@inshop.ir',
      isVerifiedSeller: true,
      sellerActivatedAt: null,
      isAdmin: false,
      sellerProfile: {
        id: 'sp1',
        userId: 'u1',
        username: 'shop_handle',
        shopName: 'Shop Name',
        bio: 'Bio text',
        address: 'Tehran address',
        addressShow: false,
        profilePhotoUrl: 'https://photo.url',
        phones: [{ id: 'p1', phoneNumber: '09123456789' }],
      },
    };

    const values = mapUserProfileToFormValues(user);
    expect(values).toEqual({
      shopName: 'Shop Name',
      username: 'shop_handle',
      bio: 'Bio text',
      address: 'Tehran address',
      showAddress: false,
      phoneNumber: '09123456789',
      profilePhotoUrl: 'https://photo.url',
    });
  });

  it('falls back to businessData, profile, and top-level avatarUrl when sellerProfile fields are missing', () => {
    const user: UserProfile = {
      id: 'u1',
      name: 'Farshad',
      email: 'test@inshop.ir',
      isVerifiedSeller: false,
      sellerActivatedAt: null,
      isAdmin: false,
      avatarUrl: 'https://avatar.url',
      profile: {
        id: 1,
        phoneNumber: '09998887766',
        firstName: 'Farshad',
        lastName: 'Test',
        nationalId: '1234567890',
        status: 'APPROVED',
        createdAt: '',
        updatedAt: '',
      },
      businessData: {
        id: 1,
        preRegistrationId: 10,
        shopName: 'PreReg Shop',
        guildId: '123',
        address: 'PreReg Address',
        bio: 'PreReg Bio',
        showAddress: true,
        createdAt: '',
        updatedAt: '',
      },
    };

    const values = mapUserProfileToFormValues(user);
    expect(values).toEqual({
      shopName: 'PreReg Shop',
      username: '',
      bio: 'PreReg Bio',
      address: 'PreReg Address',
      showAddress: true,
      phoneNumber: '09998887766',
      profilePhotoUrl: 'https://avatar.url',
    });
  });

  it('correctly maps backend /user/profile direct payload format', () => {
    const apiPayload: UserProfile = {
      id: 'ed0b5934-7f49-4a97-80e7-ad57ab694ac0',
      userId: 'ly9XyIUVNRPughPQwDdZ7k3Vt8PqbcYh',
      username: 'BeheshtAien',
      shopName: 'آموزش هوش مصنوعی | محمد بهشت آئین',
      bio: 'آموزشگاه ما در زمینه کار با کودکان بزرگسالان انواع انسان های خنگ با ضریب هوشی منفی کار میکند',
      profilePhotoUrl: null,
      address: 'فارس، شیراز، معالی آباد، ساختمان الف، طبقه 6، واحد 604',
      addressProvince: null,
      addressCity: null,
      addressShow: true,
      phones: [
        {
          id: 'b55a11ca-e5e4-4c75-933f-2b231156bf0c',
          phoneNumber: '09035703067',
          label: 'فروشگاه',
        },
      ],
    };

    const values = mapUserProfileToFormValues(apiPayload);
    expect(values).toEqual({
      shopName: 'آموزش هوش مصنوعی | محمد بهشت آئین',
      username: 'BeheshtAien',
      bio: 'آموزشگاه ما در زمینه کار با کودکان بزرگسالان انواع انسان های خنگ با ضریب هوشی منفی کار میکند',
      address: 'فارس، شیراز، معالی آباد، ساختمان الف، طبقه 6، واحد 604',
      showAddress: true,
      phoneNumber: '09035703067',
      profilePhotoUrl: '',
    });
  });
});
