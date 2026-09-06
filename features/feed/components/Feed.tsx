'use client';

import { useInfiniteFeedPosts } from '../services/feedService';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { PullToRefreshIndicator } from './PullToRefreshIndicator';
import { FeedContent } from './FeedContent';
import { FeedSearch } from './FeedSearch';

export function Feed() {
  const {
    posts,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteFeedPosts();

  const {
    mainRef,
    pullDistance,
    isPullDownActive,
    isRefreshing,
    bind,
  } = usePullToRefresh({ onRefresh: refetch });

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden relative">
      <FeedSearch>
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          isPullDownActive={isPullDownActive}
        />

        <main
          ref={mainRef}
          {...bind()}
          className="flex-1 overflow-y-auto overscroll-contain hide-scrollbar pb-20 bg-white select-none relative"
          id="home-grid-container"
        >
          <FeedContent
            posts={posts}
            isLoading={isLoading}
            isError={isError}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            onRetry={refetch}
          />
        </main>
      </FeedSearch>
    </div>
  );
}

