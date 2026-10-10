'use client';

import { useInfiniteFeedPosts, isFeedSessionExpiredError } from '../services/feedService';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { PullToRefreshIndicator } from './PullToRefreshIndicator';
import { FeedContent } from './FeedContent';
import { FeedSearch } from './FeedSearch';

export function Feed() {
  const {
    posts,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    resetFeed,
  } = useInfiniteFeedPosts();

  const handleRetry = () => {
    // If the failure was due to an expired or mismatched feed session token,
    // retrying fetchNextPage() would resend the exact same invalid cursor.
    // Resetting the feed restarts query execution cleanly from page 1.
    if (isFeedSessionExpiredError(error)) {
      resetFeed();
    } else if (posts.length > 0 && hasNextPage) {
      fetchNextPage();
    } else {
      resetFeed();
    }
  };

  const {
    mainRef,
    pullDistance,
    isPullDownActive,
    isRefreshing,
    bind,
  } = usePullToRefresh({ onRefresh: resetFeed });

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
            onRetry={handleRetry}
          />
        </main>
      </FeedSearch>
    </div>
  );
}
