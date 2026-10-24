/** Cache tag for a seller's cached public profile. Used both to cache it and to expire it. */
export function sellerProfileCacheTag(username: string): string {
  return `seller-${username.trim().toLowerCase()}`;
}
