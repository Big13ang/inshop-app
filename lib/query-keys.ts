import type { QueryClient } from '@tanstack/react-query';

export const queryKeys = {
  posts: {
    all: ['posts'] as const,
    seller: () => [...queryKeys.posts.all, 'seller'] as const,
    pending: () => queryKeys.posts.seller(),
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
    byUsername: (username: string) => ['user', 'profile', username] as const,
  },
} as const;

export const queryCacheFactory = {
  posts: {
    invalidateSeller: (queryClient: QueryClient) => {
      return queryClient.invalidateQueries({ queryKey: queryKeys.posts.seller() });
    },
    invalidatePending: (queryClient: QueryClient) => {
      return queryClient.invalidateQueries({ queryKey: queryKeys.posts.seller() });
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

