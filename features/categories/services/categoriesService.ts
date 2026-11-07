import { useQuery } from '@tanstack/react-query';
import { http, Result, type ApiResponse } from '@/lib/utils';
import type { CategoryNode, CategoryTreeData } from '../types';

const CATEGORY_TREE_QUERY_KEY = ['categories', 'tree'] as const;

// Works on the server (landing pages without the react-query provider) and in the browser.
export async function fetchCategoryTree(): Promise<CategoryNode[]> {
    const result = await Result.try(() => http.get<ApiResponse<CategoryTreeData>>('/categories/tree'));
    return Result.unwrap(result).data.categories;
}

// Client components inside the app shell (QueryClientProvider is mounted in app/(main)/providers.tsx).
export function useCategoryTree() {
    return useQuery({
        queryKey: CATEGORY_TREE_QUERY_KEY,
        queryFn: fetchCategoryTree,
        staleTime: 1000 * 60 * 5,
    });
}
