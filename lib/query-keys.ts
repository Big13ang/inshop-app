import type { QueryClient } from '@tanstack/react-query';

export const queryKeys = {
  posts: {
    all: ['posts'] as const,
    pending: () => [...queryKeys.posts.all, 'pending'] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
    uploadSession: () => [...queryKeys.posts.all, 'upload-session'] as const,
  },
  auth: {
    session: ['auth', 'session'] as const,
  },
  profile: {
    me: ['profile', 'me'] as const,
    checkUsername: (username: string) => ['profile', 'check-username', username] as const,
  },
  user: {
    profile: ['user', 'profile'] as const,
  },
} as const;

export const queryCacheFactory = {
  posts: {
    invalidatePending: (queryClient: QueryClient) => {
      return queryClient.invalidateQueries({ queryKey: queryKeys.posts.pending() });
    },
    invalidateAll: (queryClient: QueryClient) => {
      return queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  },

  auth: {
    invalidateSession: (queryClient: QueryClient) => {
      return queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
    },
  },

  profile: {
    invalidateMe: (queryClient: QueryClient) => {
      return queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
    },
  },

  user: {
    invalidateProfile: (queryClient: QueryClient) => {
      return queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
    },
  },
};

