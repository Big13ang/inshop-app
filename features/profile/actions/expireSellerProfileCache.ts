'use server';

import { updateTag } from 'next/cache';
import { USERNAME_REGEX } from '@/features/profile/edit/editProfileSchema';
import { sellerProfileCacheTag } from '@/features/profile/services/sellerProfileCacheTag';

/** Expires a seller's cached public profile, so its post list stops showing a deleted post. */
export async function expireSellerProfileCache(username: string): Promise<void> {
  if (!USERNAME_REGEX.test(username.trim())) return;
  updateTag(sellerProfileCacheTag(username));
}
