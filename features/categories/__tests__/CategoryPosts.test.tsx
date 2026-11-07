import { Suspense } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from '@/lib/utils';
import { CategoryPosts } from '../components/CategoryPosts';

jest.mock('@/lib/utils', () => {
    const actual = jest.requireActual('@/lib/utils');
    return { ...actual, http: { get: jest.fn() } };
});
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ back: jest.fn(), push: mockPush }) }));
jest.mock('../services/categoriesService', () => ({
    useCategoryTree: () => ({ data: [{ id: 'cat-1', name: 'موبایل', parentId: null }] }),
}));
jest.mock('@/features/feed/components/FeedContent', () => ({
    FeedContent: ({ posts, emptyState }: { posts: { id: string }[]; emptyState: React.ReactNode }) => (
        <div data-testid="posts">{posts.length === 0 ? emptyState : posts.length}</div>
    ),
}));

const mockGet = http.get as jest.Mock;

async function renderCategoryPosts() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await act(async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <Suspense>
                    <CategoryPosts params={Promise.resolve({ id: 'cat-1' })} />
                </Suspense>
            </QueryClientProvider>,
        );
    });
}

describe('CategoryPosts', () => {
    it('requests the posts of the category and shows its name', async () => {
        mockGet.mockResolvedValueOnce({
            data: [{ id: 'p1' }, { id: 'p2' }],
            pagination: { nextCursor: null, hasNext: false },
        });

        await renderCategoryPosts();

        await waitFor(() => expect(screen.getByTestId('posts')).toHaveTextContent('2'));
        expect(screen.getByText('موبایل')).toBeInTheDocument();
        const [path, options] = mockGet.mock.calls[0];
        expect(path).toBe('/categories/cat-1/posts');
        expect(options.searchParams.get('limit')).toBe('15');
    });

    it('shows the category empty message when it has no posts', async () => {
        mockGet.mockResolvedValueOnce({ data: [], pagination: { nextCursor: null, hasNext: false } });

        await renderCategoryPosts();

        expect(await screen.findByText('هیچ محصولی در این دسته بندی یافت نشد')).toBeInTheDocument();
    });

    it('lets the user browse other categories from the empty state', async () => {
        mockGet.mockResolvedValueOnce({ data: [], pagination: { nextCursor: null, hasNext: false } });

        await renderCategoryPosts();
        fireEvent.click(await screen.findByRole('button', { name: 'مشاهده سایر دسته‌بندی‌ها' }));

        expect(mockPush).toHaveBeenCalledWith('/categories');
    });
});
