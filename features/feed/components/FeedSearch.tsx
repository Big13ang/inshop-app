'use client';

import { useState, type ChangeEvent, type ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { InShopSearchResult } from '@/features/search/components/InShopSearchResult';

export interface FeedSearchProps {
  children: ReactNode;
}

export function FeedSearch({ children }: FeedSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 350);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const isSearchActive = searchQuery.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden relative">
      <header className="bg-white px-4 pt-5 pb-3 w-full border-b border-zinc-200/60 sticky top-0 z-50 shrink-0 select-none">
        <div className="relative flex items-center w-full">
          <div className="absolute right-3 text-zinc-400 pointer-events-none flex items-center justify-center z-10">
            <Search className="w-4 h-4 text-zinc-400" />
          </div>

          <Input
            type="text"
            placeholder="برای جستجو بنویسید ..."
            className="w-full bg-zinc-100/90 hover:bg-zinc-100 text-zinc-900 text-xs rounded-xl pr-9 pl-9 py-2.5 border border-zinc-200/60 focus:bg-white focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/5 placeholder:text-zinc-400 transition-all text-right"
            id="home-search-input"
            dir="rtl"
            value={searchQuery}
            onChange={handleSearchChange}
          />

          {isSearchActive && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              shape="circle"
              onClick={handleClearSearch}
              className="absolute left-2.5 text-zinc-400 hover:text-zinc-700 z-10 p-0 h-6 w-6"
              aria-label="پاک کردن جستجو"
              id="clear-search-btn"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </header>

      {/* Main feed content slot: kept in DOM with hidden class so scroll position and feed state are preserved */}
      <div className={cn('flex-1 flex flex-col overflow-hidden relative', isSearchActive && 'hidden')}>
        {children}
      </div>

      {/* Search results overlay: displayed when query is active */}
      {isSearchActive && (
        <div
          className="flex-1 overflow-y-auto overscroll-contain hide-scrollbar pb-20 bg-white select-none relative"
          id="search-result-container"
        >
          <InShopSearchResult query={debouncedQuery} />
        </div>
      )}
    </div>
  );
}
