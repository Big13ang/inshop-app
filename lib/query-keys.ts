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
