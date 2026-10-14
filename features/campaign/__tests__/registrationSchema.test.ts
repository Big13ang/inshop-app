import { step2Schema } from '../organisms/registration-form/schema';
import { profileSchema } from '@/features/profile/edit/editProfileSchema';

const validBusinessStep = {
  storeId: 'shop_id',
  followers: '۱۰ تا ۲۰ هزار',
  category: 'مد و پوشاک',
  description: 'معرفی فروشگاه',
};

const validProfile = {
  shopName: 'فروشگاه تست',
  shopPhoneNumber: '09123456789',
  username: 'valid_user',
  address: 'تهران، خیابان ولیعصر، پلاک ۱۰۰',
  addressShow: true,
  bio: 'توضیحات کوتاه',
};

function storeIdMessage(storeId: string) {
  const result = step2Schema.safeParse({ ...validBusinessStep, storeId });
  return result.success ? null : result.error.issues[0].message;
}

function profileInstagramMessage(instagramUsername: string) {
  const result = profileSchema.safeParse({ ...validProfile, instagramUsername });
  return result.success ? null : result.error.issues[0].message;
}

describe('campaign registration storeId validation', () => {
  it('requires an Instagram ID', () => {
    expect(storeIdMessage('')).toBe('آیدی اینستاگرام الزامی است');
  });

  it.each([
    'shop_id',
    'my.shop',
    'a.b_c.123',
    'abc',
    'a'.repeat(30),
    'ab',
    'a'.repeat(31),
    '.shop',
    'shop.',
    'my..shop',
    'my shop',
  ])('matches the /profile/edit Instagram rule for "%s"', (handle) => {
    expect(storeIdMessage(handle)).toBe(profileInstagramMessage(handle));
  });
});
