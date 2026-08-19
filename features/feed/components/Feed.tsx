'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useInfiniteFeedPosts } from '../services/feedService';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { PullToRefreshIndicator } from './PullToRefreshIndicator';
import { FeedContent } from './FeedContent';

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
      <div className="flex-1 flex flex-col h-full bg-white overflow-hidden relative">
        <header className="bg-white px-4 pt-5 pb-3 w-full border-b border-zinc-200/60 sticky top-0 z-50 shrink-0 select-none">
          <div className="relative flex items-center w-full">
            <div className="absolute right-3 text-zinc-400 pointer-events-none flex items-center justify-center z-10">
              <Search className="w-4 h-4 text-zinc-400" />
            </div>

            <Input
              type="text"
              placeholder="جستجو در ویدیوها، طلا، کفش، خودرو..."
              className="w-full bg-zinc-100/90 hover:bg-zinc-100 text-zinc-900 text-xs rounded-xl pr-9 pl-4 py-2.5 border border-zinc-200/60 focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 placeholder:text-zinc-400 transition-all text-right"
              id="home-search-input"
              dir="rtl"
              readOnly
            />
          </div>
        </header>

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
      </div>
    </div>
  );
}

export default Feed;
