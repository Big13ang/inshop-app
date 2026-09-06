'use client';

import type { InShopSearchResultProps } from '../types';
import { useSearchQuery } from '../services/searchService';
import { AccountsSection } from './AccountsSection';
import { SearchResultSkeleton } from './SearchResultSkeleton';
import { SearchEmptyState } from './SearchEmptyState';
import { SearchErrorState } from './SearchErrorState';
import { GridTile } from '@/features/feed/components/GridTile';
import { useInfiniteScrollSentinel } from '@/features/feed/hooks/useInfiniteScrollSentinel';
import { cleanSearchQuery } from '../utils/searchSanitizer';
import { cn } from '@/lib/utils';

function SearchHint() {
  return (
    <div className="w-full py-16 px-6 flex flex-col items-center justify-center text-center select-none text-zinc-400 text-xs animate-fade-in">
      <p>حداقل ۳ حرف برای جستجو وارد کنید</p>
    </div>
  );
}

export function InShopSearchResult({
  query,
  profiles,
  posts,
  emptyStateTitle,
  emptyStateDescription,
  className = '',
}: InShopSearchResultProps) {
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useSearchQuery(query);
  const cleanQuery = cleanSearchQuery(query);

  const sentinelRef = useInfiniteScrollSentinel({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  const relevantProfiles = (profiles ?? data?.pages[0]?.profiles ?? []).slice(0, 4);
  const matchedPosts = posts ?? data?.pages.flatMap((page) => page.posts) ?? [];
  const hasResults = relevantProfiles.length > 0 || matchedPosts.length > 0;
  const isCustomData = Boolean(profiles || posts);

  if (!hasResults) {
    if (!cleanQuery) {
      return null;
    }
    if (cleanQuery.length < 3) {
      return <SearchHint />;
    }
    if (isLoading) {
      return <SearchResultSkeleton />;
    }
    if (isError) {
      return <SearchErrorState />;
    }

    return (
      <div className="w-full animate-fade-in">
        <SearchEmptyState
          query={cleanQuery}
          title={emptyStateTitle}
          description={emptyStateDescription}
        />
      </div>
    );
  }

  return (
    <div
      className={cn('w-full flex flex-col animate-fade-in', className)}
      id="inshop-search-result-system"
      dir="rtl"
    >
      {/* Top 4 Most Relevant Profiles */}
      {relevantProfiles.length > 0 && (
        <>
          <AccountsSection
            profiles={relevantProfiles}
          />
          <div className="w-full h-px bg-zinc-100 my-1" />
        </>
      )}

      {/* Matching Posts Grid */}
      {matchedPosts.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-0.5 w-full bg-white mt-1" id="inshop-products-grid">
            {matchedPosts.map((post) => (
              <GridTile key={post.id} post={post} />
            ))}
          </div>

          {!isCustomData && hasNextPage && (
            <div
              ref={sentinelRef}
              className="h-12 w-full flex items-center justify-center py-4"
              id="search-infinite-scroll-sentinel"
            >
              {isFetchingNextPage && (
                <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
