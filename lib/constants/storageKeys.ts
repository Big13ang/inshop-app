/**
 * Centralized registry for all client-side storage keys.
 *
 * localStorage — persisted across sessions, device-scoped.
 * cookies      — for keys that need to be readable server-side (e.g. middleware).
 */
export const storageKeys = {
  localStorage: {
    posts: {
      addPostOnboardingSeen: 'inshop:add-post-onboarding-seen',
    },
  },

  cookies: {
    // e.g. auth: { sessionToken: 'better-auth.session_token' }
  },
} as const;
