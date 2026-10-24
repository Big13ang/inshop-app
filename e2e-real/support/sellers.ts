import { FOLLOWER_RANGES, PRODUCT_CATEGORIES } from '@/features/campaign/constants/registration';
import { uniqueInstagramId, uniqueNationalId } from './identities';

/** Everything the /seller/apply form asks for */
export interface SellerApplication {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  nationalId: string;
  province: string;
  city: string;
  instagramId: string;
  followers: string;
  category: string;
  description: string;
}

/** A valid application for this phone, with its own national ID and Instagram handle */
export function newSellerApplication(phoneNumber: string): SellerApplication {
  return {
    firstName: 'آزمون',
    lastName: 'خودکار',
    phoneNumber,
    nationalId: uniqueNationalId(),
    province: 'تهران',
    city: 'تهران',
    instagramId: uniqueInstagramId(),
    followers: FOLLOWER_RANGES[0],
    category: PRODUCT_CATEGORIES[0],
    description: 'فروشگاه آزمایشی تست خودکار',
  };
}
