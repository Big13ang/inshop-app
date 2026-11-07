'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { FeedContent } from '@/features/feed/components/FeedContent';
import { CATEGORIES_TEXT } from '../constants';
import { useCategoryTree } from '../services/categoriesService';
import { useInfiniteCategoryPosts } from '../services/categoryPostsService';

export function CategoryPosts({ params }: { params: Promise<{ id: string }> }) {
    const { id: categoryId } = use(params);
    const router = useRouter();
    const { data: categories = [] } = useCategoryTree();
    const { data: posts = [], isLoading, isError, isFetchingNextPage, hasNextPage, fetchNextPage } =
        useInfiniteCategoryPosts(categoryId);

    const handleBrowseCategories = () => router.push('/categories');

    const title = categories.find((category) => category.id === categoryId)?.name;

    return (
        <>
            <Header.Root>
                <Header.Back />
                <Header.Title>{title}</Header.Title>
                <Header.Right />
            </Header.Root>
            <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar pb-20">
                <FeedContent
                    posts={posts}
                    isLoading={isLoading}
                    isError={isError}
                    isFetchingNextPage={isFetchingNextPage}
                    hasNextPage={hasNextPage}
                    fetchNextPage={fetchNextPage}
                    listName="category_posts"
                    emptyState={<EmptyCategory onBrowse={handleBrowseCategories} />}
                />
            </div>
        </>
    );
}

function EmptyCategory({ onBrowse }: { onBrowse: () => void }) {
    return (
        <div className="flex flex-col items-center gap-4">
            <p className="text-center text-sm text-secondary">{CATEGORIES_TEXT.noPosts}</p>
            <Button variant="secondary" size="sm" onClick={onBrowse}>
                {CATEGORIES_TEXT.browseCategories}
            </Button>
        </div>
    );
}
