import type { QueryClient } from '@tanstack/react-query';

export const queryKeys = {
  posts: {
    all: ['posts'] as const,
    pending: () => [...queryKeys.posts.all, 'pending'] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
  },
  auth: {
    session: ['auth', 'session'] as const,
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
};

