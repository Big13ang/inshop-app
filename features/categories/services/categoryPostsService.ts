import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchPostsPage } from '@/features/feed/services/feedService';

// A parent category also returns the posts of its sub-categories.
export function useInfiniteCategoryPosts(categoryId: string) {
    return useInfiniteQuery({
        queryKey: ['posts', 'category', categoryId],
        queryFn: ({ pageParam }) => fetchPostsPage(`/categories/${categoryId}/posts`, pageParam),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => (lastPage.pagination.hasNext ? lastPage.pagination.nextCursor : undefined),
        select: (data) => data.pages.flatMap((page) => page.data),
    });
}
