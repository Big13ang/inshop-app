import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { http, Result } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import { useUser } from '@/features/profile/context/UserContext';
import { expireSellerProfileCache } from '@/features/profile/actions/expireSellerProfileCache';
import type {
  SellerPost,
  SellerPostsByUsernameData,
  CursorPaginatedResult,
} from '@/features/posts/types';

export interface DeletionRollbackContext {
  previousSellerInfinite: [readonly unknown[], unknown][];
  previousUserProfile: [readonly unknown[], unknown][];
  previousFeed: [readonly unknown[], unknown][];
  previousSellerApproved: [readonly unknown[], unknown][];
  previousPendingRejected: [readonly unknown[], unknown][];
}

export function snapshotPostCaches(queryClient: QueryClient): DeletionRollbackContext {
  return {
    previousSellerInfinite: queryClient.getQueriesData({
      queryKey: [...queryKeys.posts.all, 'seller-username-infinite'],
    }),
    previousUserProfile: queryClient.getQueriesData({
      queryKey: queryKeys.user.profile,
    }),
    previousFeed: queryClient.getQueriesData({
      queryKey: ['posts', 'feed'],
    }),
    previousSellerApproved: queryClient.getQueriesData({
      queryKey: [...queryKeys.posts.all, 'seller-approved'],
    }),
    previousPendingRejected: queryClient.getQueriesData({
      queryKey: [...queryKeys.posts.seller(), 'pending-rejected'],
    }),
  };
}

export function rollbackPostCaches(
  queryClient: QueryClient,
  context?: DeletionRollbackContext
) {
  if (!context) return;

  for (const [key, data] of context.previousSellerInfinite) {
    queryClient.setQueryData(key, data);
  }
  for (const [key, data] of context.previousUserProfile) {
    queryClient.setQueryData(key, data);
  }
  for (const [key, data] of context.previousFeed) {
    queryClient.setQueryData(key, data);
  }
  for (const [key, data] of context.previousSellerApproved) {
    queryClient.setQueryData(key, data);
  }
  for (const [key, data] of context.previousPendingRejected) {
    queryClient.setQueryData(key, data);
  }
}

export async function invalidatePostDeletionQueries(queryClient: QueryClient, deletedId: string) {
  // 1. First invalidate pending-rejected
  await queryClient.invalidateQueries({
    queryKey: [...queryKeys.posts.seller(), 'pending-rejected'],
  });

  // 2. Then invalidate for username and all post queries, except the public detail query.
  // Refetching it while its page is still shown turns the page into a 404.
  await queryClient.invalidateQueries({
    queryKey: queryKeys.user.profile,
  });
  await queryClient.invalidateQueries({
    queryKey: queryKeys.posts.all,
    predicate: (query) => query.queryKey[1] !== 'public-detail',
  });

  // 3. Mark the deleted post's detail stale without refetching it. It refetches (and shows 404)
  // only when someone next opens that post.
  await queryClient.invalidateQueries({
    queryKey: ['posts', 'public-detail', deletedId],
    refetchType: 'none',
  });
}

export function removePostFromFeedCache(queryClient: QueryClient, deletedId: string) {
  queryClient.setQueriesData<{ pages: { data: { id: string }[] }[] }>(
    { queryKey: ['posts', 'feed'] },
    (oldData) => {
      if (!oldData?.pages) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          data: page.data.filter((post) => post.id !== deletedId),
        })),
      };
    }
  );
}

export function removePostFromSellerUsernameInfiniteCache(
  queryClient: QueryClient,
  deletedId: string
) {
  queryClient.setQueriesData<{ pages: { data: { id: string }[] }[] }>(
    { queryKey: [...queryKeys.posts.all, 'seller-username-infinite'] },
    (oldData) => {
      if (!oldData?.pages) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          data: page.data.filter((post) => post.id !== deletedId),
        })),
      };
    }
  );
}

export function removePostFromUserProfileCache(
  queryClient: QueryClient,
  deletedId: string
) {
  queryClient.setQueriesData<SellerPostsByUsernameData>(
    { queryKey: queryKeys.user.profile },
    (oldData) => {
      if (!oldData || !Array.isArray(oldData.products)) return oldData;
      return {
        ...oldData,
        products: oldData.products.filter((post) => post.id !== deletedId),
        pagination: oldData.pagination
          ? {
              ...oldData.pagination,
              total:
                typeof oldData.pagination.total === 'number'
                  ? Math.max(0, oldData.pagination.total - 1)
                  : oldData.pagination.total,
            }
          : undefined,
      };
    }
  );
}

export function removePostFromSellerApprovedCache(
  queryClient: QueryClient,
  deletedId: string
) {
  queryClient.setQueriesData<CursorPaginatedResult<SellerPost>>(
    { queryKey: [...queryKeys.posts.all, 'seller-approved'] },
    (oldData) => {
      if (!oldData?.data) return oldData;
      return {
        ...oldData,
        data: oldData.data.filter((post) => post.id !== deletedId),
      };
    }
  );
}

type PendingRejectedCacheData =
  | SellerPost[]
  | { pages?: { data?: { id?: string }[] }[] };

export function removePostFromPendingRejectedCache(
  queryClient: QueryClient,
  deletedId: string
) {
  queryClient.setQueriesData<PendingRejectedCacheData>(
    { queryKey: [...queryKeys.posts.seller(), 'pending-rejected'] },
    (oldData) => {
      if (!oldData) return oldData;
      if (Array.isArray(oldData)) {
        return oldData.filter((post) => post.id !== deletedId);
      }
      if (Array.isArray(oldData.pages)) {
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            data: Array.isArray(page.data)
              ? page.data.filter((post) => post.id !== deletedId)
              : page.data,
          })),
        };
      }
      return oldData;
    }
  );
}

export function removePostFromAllCaches(queryClient: QueryClient, deletedId: string) {
  removePostFromFeedCache(queryClient, deletedId);
  removePostFromSellerUsernameInfiniteCache(queryClient, deletedId);
  removePostFromUserProfileCache(queryClient, deletedId);
  removePostFromSellerApprovedCache(queryClient, deletedId);
  removePostFromPendingRejectedCache(queryClient, deletedId);
  // Only inactive detail queries are removed. The post page being left is still mounted;
  // removing its active query makes it refetch, get a 404 and show the not-found screen.
  queryClient.removeQueries({ queryKey: queryKeys.posts.detail(deletedId), type: 'inactive' });
  queryClient.removeQueries({ queryKey: ['posts', 'public-detail', deletedId], type: 'inactive' });
}

// Fire-and-forget: the delete already succeeded, so a cache-expiry failure must not show an error.
// Only the seller's profile needs expiring: crawlers asking for the deleted post itself get a 404 from the proxy.
function expireSellerProfileAfterDelete(sellerUsername?: string | null) {
  if (!sellerUsername) return;
  void Result.try(expireSellerProfileCache(sellerUsername));
}

export function useDeletePendingPost() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation<void, unknown, string, DeletionRollbackContext>({
    mutationFn: async (id: string) => {
      await http.delete(`/seller/posts/${id}`);
    },
    onMutate: async (deletedId: string) => {
      // Cancel in-flight queries so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.user.profile });

      // Snapshot caches for rollback on error
      const rollbackContext = snapshotPostCaches(queryClient);

      // Optimistically remove post from username/profile, feed, and other caches immediately
      removePostFromAllCaches(queryClient, deletedId);

      return rollbackContext;
    },
    onError: (_error, _deletedId, context) => {
      rollbackPostCaches(queryClient, context);
      toast.error(ERROR_MESSAGES.posts.deleteFailed);
    },
    onSuccess: () => {
      toast.success('پست با موفقیت حذف شد');
      expireSellerProfileAfterDelete(user?.sellerProfile?.username);
    },
    onSettled: async (_data, _error, deletedId) => {
      // First invalidate pending-rejected, then username/profile & all posts
      await invalidatePostDeletionQueries(queryClient, deletedId);
    },
  });
}
