/**
 * Public seller profiles and public posts are cached per frontend replica, with no shared cache.
 * Refreshing every 5 seconds lets an edit or a deleted post reach every replica within seconds.
 * `stale` is the client router's minimum (30 seconds); `expire` stays at 5 minutes so these
 * entries are not turned into request-time holes. See ADR-017 in the infrastructure handbook.
 */
export const PUBLIC_CONTENT_CACHE_LIFE = { stale: 30, revalidate: 5, expire: 300 } as const;
